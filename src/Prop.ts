import { mat4, quat, vec3 } from 'gl-matrix';
import Transform from './Transform';
import Material from './Material';
import MeshData from './MeshData';
import { ShaderUtility } from './ShaderUtilities';
/**
 * The base class for items visible ion stages in Prismatic Engine.
 */
export default class Prop {
    name?: string;
    mesh?: MeshData[];
    transform: Transform;
    id: number;
    enable_fake_normals = 0.0;

    normalMatrix: mat4;
    normal_matrix_buffer: GPUBuffer;
    normal_matrix_back_buffer: GPUBuffer;

    prop_transform_bind_group: GPUBindGroup;
    prop_back_buffer: GPUBuffer;
    prop_buffer: GPUBuffer;

    constructor(mesh?: MeshData[], device?: GPUDevice, name?: string, id?: number, qRotation?: quat, translation?: vec3, scale?: vec3) {
        this.mesh = mesh;
        this.mesh.forEach((m) => m.buildBuffers(device));
        this.transform = new Transform(qRotation, translation, scale);
        this.normalMatrix = mat4.create();
        this.name = name;
        this.id = id;
    }

    changeColor(color: vec3) {
        for (let i = 0; i < this.mesh.length; i++) {
            this.mesh[i].material.color = color;
        }
    }

    initialize_Buffers(device: GPUDevice) {
        this.prop_back_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.normal_matrix_back_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.prop_transform_bind_group = device.createBindGroup({
            layout: ShaderUtility.BindGroupLayoutList.transform_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.prop_back_buffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.normal_matrix_back_buffer }
                }
            ]
        });
    }

    buildBuffers(device: GPUDevice) {
        this.prop_buffer = device.createBuffer({ size: 16 * 4, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true });
        this.normal_matrix_buffer = device.createBuffer({ size: 16 * 4, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true });

        let transform_array = new Float32Array(this.prop_buffer.getMappedRange());
        transform_array.set(this.transform.matrix);
        this.prop_buffer.unmap();

        this.normalMatrix = mat4.invert(this.normalMatrix, this.transform.matrix);
        this.normalMatrix = mat4.transpose(this.normalMatrix, this.normalMatrix);

        let normal_array = new Float32Array(this.normal_matrix_buffer.getMappedRange());
        normal_array.set(this.normalMatrix);
        this.normal_matrix_buffer.unmap();

        for (let i = 0; i < this.mesh.length; i++) {
            this.mesh[i].buildBuffers(device);
        }
    }

    encodeCommands(commandEncoder: GPUCommandEncoder) {
        commandEncoder.copyBufferToBuffer(this.prop_buffer, 0, this.prop_back_buffer, 0, 16 * 4);
        commandEncoder.copyBufferToBuffer(this.normal_matrix_buffer, 0, this.normal_matrix_back_buffer, 0, 16 * 4);
        for (let i = 0; i < this.mesh.length; i++) {
            this.mesh[i].material.encodeCommands(commandEncoder);
        }
    }

    /**
     * Draw's the prop
     * @param device GPU
     * @param passEncoder The renderpass to be used.
     */
    draw(device: GPUDevice, passEncoder: GPURenderPassEncoder) {
        for (let i = 0; i < this.mesh.length; i++) {
            passEncoder.setPipeline(this.mesh[i].material.shader.pipeline);
            this.mesh[i].material.setBindGroups(device, passEncoder);
            passEncoder.setBindGroup(1, this.prop_transform_bind_group);
            passEncoder.setVertexBuffer(0, this.mesh[i].vertex_buffer);
            passEncoder.setVertexBuffer(1, this.mesh[i].color_buffer);
            passEncoder.setVertexBuffer(2, this.mesh[i].normals_buffer);
            passEncoder.setVertexBuffer(3, this.mesh[i].text_coords_buffer);
            passEncoder.setIndexBuffer(this.mesh[i].index_buffer, 'uint16');
            passEncoder.drawIndexed(this.mesh[i].indices.length, 1);
        }
    }
}
