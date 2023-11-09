import { vec4, vec3 } from 'gl-matrix';
import Shader from './Shader';
import { ShaderUtility } from './ShaderUtilities';
import Texture from './Texture';
import Material from './Material';

export default class PBRMaterial extends Material {
    //PBR
    roughness: number;
    metallic: number = 0;
    color: vec3;

    material_color_buffer: GPUBuffer;
    material_color_back_buffer: GPUBuffer;

    material_roughness_buffer: GPUBuffer;
    material_roughness_back_buffer: GPUBuffer;

    material_metallic_buffer: GPUBuffer;
    material_metallic_back_buffer: GPUBuffer;

    pbr_material_bind_group: GPUBindGroup;

    constructor(roughness: number, metallic: number, name: string, texture?: Texture, color?: vec4, device?: GPUDevice) {
        super(name, texture, color, device);
        this.roughness = roughness;
        this.metallic = metallic;
        this.color = vec3.fromValues(this.defaultColor[0], this.defaultColor[1], this.defaultColor[2]);
    }

    initializeBindGroup() {
        super.initializeBindGroup();
        this.material_color_buffer = this.device.createBuffer({
            size: 12,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.material_color_back_buffer = this.device.createBuffer({
            size: 12,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.material_roughness_buffer = this.device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.material_roughness_back_buffer = this.device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.material_metallic_buffer = this.device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.material_metallic_back_buffer = this.device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.pbr_material_bind_group = this.device.createBindGroup({
            layout: ShaderUtility.BindGroupLayoutList.pbr_material_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.material_color_back_buffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.material_roughness_back_buffer }
                },
                {
                    binding: 2,
                    resource: { buffer: this.material_metallic_back_buffer }
                }
            ]
        });
    }

    buildBuffers(device: GPUDevice) {
        super.buildBuffers(device);

        this.material_color_buffer = device.createBuffer({
            size: 12,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });
        let material_color = new Float32Array(this.material_color_buffer.getMappedRange());
        material_color.set(this.color);
        this.material_color_buffer.unmap();

        this.material_roughness_buffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });

        let material_roughness = new Float32Array(this.material_roughness_buffer.getMappedRange());
        material_roughness.set([this.roughness]);
        this.material_roughness_buffer.unmap();

        this.material_metallic_buffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });

        let material_metallic = new Float32Array(this.material_metallic_buffer.getMappedRange());
        material_metallic.set([this.metallic]);
        this.material_metallic_buffer.unmap();
    }

    setBindGroups(device: GPUDevice, passEncoder: GPURenderPassEncoder) {
        super.setBindGroups(device, passEncoder);
        passEncoder.setBindGroup(3, this.pbr_material_bind_group);
    }

    encodeCommands(commandEncoder: GPUCommandEncoder) {
        super.encodeCommands(commandEncoder);
        commandEncoder.copyBufferToBuffer(this.material_color_buffer, 0, this.material_color_back_buffer, 0, 12);
        commandEncoder.copyBufferToBuffer(this.material_roughness_buffer, 0, this.material_roughness_back_buffer, 0, 4);
        commandEncoder.copyBufferToBuffer(this.material_metallic_buffer, 0, this.material_metallic_back_buffer, 0, 4);
    }
}
