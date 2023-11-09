import { glMatrix, vec3, mat4 } from 'gl-matrix';
import { ShaderUtility } from './ShaderUtilities';
import Transform from './Transform';
import { DEGREES_TO_RADIANS, OPENGL_TO_WGPU_MATRIX } from './Utilities';

/**
 * A simplistic camera class for the renderer.
 */
export default class Camera {
    position: vec3;
    target: vec3;
    up: vec3;
    aspect_ratio: number;
    near_clip: number;
    far_clip: number;
    fov: number;

    yaw: number = 0.0;
    pitch: number = 0.0;

    transform: Transform;

    camera_buffer: GPUBuffer;
    view_back_buffer: GPUBuffer;
    projection_back_buffer: GPUBuffer;

    camera_position_buffer: GPUBuffer;
    camera_position_back_buffer: GPUBuffer;

    camera_bind_group_layout: GPUBindGroupLayout;
    camera_bind_group: GPUBindGroup;
    view_project_bind_group: GPUBindGroup;

    view_buffer: GPUBuffer;
    projection_buffer: GPUBuffer;

    view: mat4;
    projection: mat4;

    camera_forward: vec3 = vec3.fromValues(0, 0, -1.0);
    camera_right: vec3 = vec3.create();
    camera_up: vec3 = vec3.create();
    world_up: vec3 = vec3.fromValues(0, 1, 0);

    constructor(position: vec3, target: vec3, up: vec3, aspect_ratio: number, near_clip: number, far_clip: number, fov: number) {
        this.target = target;
        this.up = up;
        this.aspect_ratio = aspect_ratio;
        this.near_clip = near_clip;
        this.far_clip = far_clip;
        this.fov = fov;

        this.transform = new Transform();
        this.transform.translate(position);
        this.buildPerspective();
    }

    translate(m: vec3) {
        this.transform.translate(m);
    }

    pitchAndYaw(pitch: number, yaw: number) {
        this.pitch += pitch;
        this.yaw += yaw;
        if (this.pitch > 89.0) {
            this.pitch = 89.0;
        }
        if (this.pitch < -89.0) {
            this.pitch = -89.0;
        }
    }

    buildView() {
        this.view = mat4.create();
        const cameraPosition = this.transform.getPosition();
        this.position = vec3.fromValues(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
        let direction: vec3 = vec3.fromValues(
            Math.cos(DEGREES_TO_RADIANS(this.yaw)) * Math.cos(DEGREES_TO_RADIANS(this.pitch)),
            Math.sin(DEGREES_TO_RADIANS(this.pitch)),
            Math.sin(DEGREES_TO_RADIANS(this.yaw)) * Math.cos(DEGREES_TO_RADIANS(this.pitch))
        );

        this.camera_forward = vec3.normalize(direction, direction);
        let target: vec3 = vec3.create();
        target = vec3.add(target, cameraPosition, this.camera_forward);
        this.view = mat4.lookAt(this.view, cameraPosition, target, this.world_up);
        this.camera_right = vec3.cross(this.camera_right, this.camera_forward, this.world_up);
        this.camera_right = vec3.normalize(this.camera_right, this.camera_right);
        this.camera_up = vec3.cross(this.camera_up, this.camera_right, this.camera_forward);
        this.camera_up = vec3.normalize(this.camera_up, this.camera_up);
    }

    /**
     * Build the camera's perspective matrix.
     */
    buildPerspective() {
        this.projection = mat4.create();
        this.projection = mat4.perspective(this.projection, DEGREES_TO_RADIANS(this.fov), this.aspect_ratio, this.near_clip, this.far_clip);
        this.projection = mat4.multiply(this.projection, OPENGL_TO_WGPU_MATRIX, this.projection);
    }

    /**
     * Initializes space on the GPU for the view,projection, and camera position matrices.
     *
     * @param device The gpu the buffers are to be sent to
     */
    initializeBuffers(device: GPUDevice) {
        //Build Buffers for View/Projection
        this.buildView();
        this.buildPerspective();

        this.view_back_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.projection_back_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.camera_position_back_buffer = device.createBuffer({
            size: 12,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.camera_bind_group = device.createBindGroup({
            layout: ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.view_back_buffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.projection_back_buffer }
                },
                {
                    binding: 2,
                    resource: { buffer: this.camera_position_back_buffer }
                }
            ]
        });
    }

    /**
     * Creates new buffer and copies the updated view,projection, and position/transform matrix to it.
     * @param device The GPU to be used
     */
    buildBuffers(device: GPUDevice) {
        this.view_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });
        this.projection_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });

        this.camera_position_buffer = device.createBuffer({
            size: 12,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });

        let view_array = new Float32Array(this.view_buffer.getMappedRange());
        view_array.set(this.view);
        this.view_buffer.unmap();

        let projection_array = new Float32Array(this.projection_buffer.getMappedRange());
        projection_array.set(this.projection);
        this.projection_buffer.unmap();

        let pos_array = new Float32Array(this.camera_position_buffer.getMappedRange());
        pos_array.set(this.position);
        this.camera_position_buffer.unmap();
    }

    /**
     * Sends the view,projection, and camera matrix copy command to the GPU.
     * @param commandEncoder
     */
    encodeCommands(commandEncoder: GPUCommandEncoder) {
        commandEncoder.copyBufferToBuffer(this.view_buffer, 0, this.view_back_buffer, 0, 16 * 4);
        commandEncoder.copyBufferToBuffer(this.projection_buffer, 0, this.projection_back_buffer, 0, 16 * 4);
        commandEncoder.copyBufferToBuffer(this.camera_position_buffer, 0, this.camera_position_back_buffer, 0, 12);
    }

    /**
     * Move camera where it is pointing.
     * @param amount amount to move camera.
     */

    moveForward(amount: number) {
        let new_position: vec3 = vec3.create();
        new_position = this.camera_forward;
        new_position = vec3.scale(new_position, new_position, amount);
        this.translate(new_position);
    }
    /**
     * Move camera right, relative to where it is pointing.
     * @param amount amount to move.
     */
    moveRight(amount: number) {
        let new_position: vec3 = vec3.create();
        new_position = this.camera_right;
        new_position = vec3.scale(new_position, new_position, amount);
        this.translate(new_position);
    }
}
