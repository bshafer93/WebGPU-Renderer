import { glMatrix, mat4, vec2, vec3, quat, vec4 } from 'gl-matrix';
import { GltfLoader } from 'gltf-loader-ts';
import MeshData from './MeshData';
import Prop from './Prop';
import Material from './Material';
import Texture from './Texture';
import Camera from './Camera';
import Light, { LightType } from './Light';
import { ShaderUtility } from './ShaderUtilities';
import { Vec3Color } from './Utilities';

/**
 * Stages are just this rendering engine's version of scenes.
 * Stages hold most of the information to render
 */
export default class Stage {
    camera: Camera;
    lights: Light[];
    sun_light: Light;
    props: Prop[]; // Contains all objects on stage
    meshes: MeshData[][]; // Contains meshes used by Props
    materials: Material[]; //Contains all materials used by meshes
    device: GPUDevice;

    lights_structs_array: Float32Array;

    sun_light_buffer: GPUBuffer;
    sun_light_back_buffer: GPUBuffer;

    lights_buffer: GPUBuffer;
    lights_back_buffer: GPUBuffer;

    multi_light_bind_group: GPUBindGroup;

    static MAX_LIGHTS = 16;

    constructor(device: GPUDevice, props: Prop[], meshes: MeshData[][], materials: Material[]) {
        this.props = props;
        this.meshes = meshes;
        this.materials = materials;
        this.device = device;
        this.lights = new Array<Light>();
        this.lights_structs_array = new Float32Array(Stage.MAX_LIGHTS * 12);

        for (let i = 0; i < Stage.MAX_LIGHTS; i++) {
            const y: number = Math.random() * 10.0;
            const x: number = Math.random() * 10.0 - 5.0;
            const z: number = Math.random() * 10.0 - 5.0;
            let color = vec3.fromValues(Math.random(), Math.random(), Math.random());
            this.lights.push(new Light(0.05, 0.8, 1.0, device, 'light' + i.toString(), vec3.fromValues(x, y, z), color));
        }
        this.sun_light = new Light(0.1, 0.4, 0.5, device, 'SunLight', vec3.fromValues(0, 10, 0.0), vec3.clone(Vec3Color.NOONSUN), LightType.SUN_LIGHT);

        this.initialize_Buffers();
    }

    createPerspectiveCamera(canvasWidth: number, canvasHeight: number) {
        //Props
        this.camera = new Camera(
            vec3.fromValues(0.0, 3.0, 10.0),
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 1.0, 0.0),
            canvasWidth / canvasHeight,
            0.1,
            100.0,
            45.0
        );

        this.camera.initializeBuffers(this.device);
    }

    removeLastProp() {
        this.props.pop();
    }

    removePropByName(name: string) {
        this.props = this.props.filter((prop) => prop.name !== name);
    }

    initialize_Buffers() {
        this.lights_buffer = this.device.createBuffer({
            size: Stage.MAX_LIGHTS * Light.light_struct_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.lights_back_buffer = this.device.createBuffer({
            size: Stage.MAX_LIGHTS * Light.light_struct_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.sun_light_buffer = this.device.createBuffer({
            size: Light.light_struct_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.sun_light_back_buffer = this.device.createBuffer({
            size: Light.light_struct_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.multi_light_bind_group = this.device.createBindGroup({
            layout: ShaderUtility.BindGroupLayoutList.multi_light_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.sun_light_back_buffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.lights_back_buffer }
                }
            ]
        });
    }

    buildAllBuffers() {
        this.camera.buildView();
        this.camera.buildBuffers(this.device);

        for (let i = 0; i < this.props.length; i++) {
            this.props[i].buildBuffers(this.device);
        }

        this.sun_light.buildBuffers(this.device);
        this.sun_light.buildLightStructBuffer();

        this.sun_light_buffer = this.device.createBuffer({
            size: Light.light_struct_size,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });
        let sun_light_struct = new Float32Array(this.sun_light_buffer.getMappedRange());
        sun_light_struct.set(this.sun_light.light_struct_array);
        this.sun_light_buffer.unmap();

        for (let i = 0; i < this.lights.length; i++) {
            this.lights[i].buildBuffers(this.device);
            this.lights[i].buildLightStructBuffer();
            this.lights_structs_array.set(this.lights[i].light_struct_array, i * Light.light_struct_size_f32);
        }

        this.lights_buffer = this.device.createBuffer({
            size: Stage.MAX_LIGHTS * Light.light_struct_size,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });
        let light_struct = new Float32Array(this.lights_buffer.getMappedRange());
        light_struct.set(this.lights_structs_array);
        this.lights_buffer.unmap();
    }

    encodeCommands(commandEncoder: GPUCommandEncoder) {
        for (let i = 0; i < this.props.length; i++) {
            this.props[i].encodeCommands(commandEncoder);
        }
        this.camera.encodeCommands(commandEncoder);

        commandEncoder.copyBufferToBuffer(this.sun_light_buffer, 0, this.sun_light_back_buffer, 0, Light.light_struct_size);
        commandEncoder.copyBufferToBuffer(this.lights_buffer, 0, this.lights_back_buffer, 0, Stage.MAX_LIGHTS * Light.light_struct_size);
    }

    buildDebugLights() {
        for (let i = 0; i < 6; i++) {
            this.lights[i].debug_prop = new Prop(
                this.props[1].mesh,
                this.device,
                'Light_Debug' + i.toString(),
                this.props.length,
                undefined,
                this.lights[i].transform.getPosition(),
                vec3.fromValues(0.1, 0.1, 0.1)
            );
            this.lights[i].debug_prop.changeColor(this.lights[i].color);
            this.props.push(this.lights[i].debug_prop);
        }
    }

    renderPass(passEncoder: GPURenderPassEncoder) {
        for (let i = 0; i < this.props.length; i++) {
            passEncoder.setBindGroup(0, this.camera.camera_bind_group);
            passEncoder.setBindGroup(2, this.multi_light_bind_group);
            this.props[i].draw(this.device, passEncoder);
        }
    }

    onTick(deltaTime) {}
}
