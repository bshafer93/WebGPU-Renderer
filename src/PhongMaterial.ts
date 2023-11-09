import { vec4, vec3 } from 'gl-matrix';
import Shader from './Shader';
import { ShaderUtility } from './ShaderUtilities';
import Texture from './Texture';
import Material from './Material';

export default class PhongMaterial extends Material {
    roughness: number;
    metallic: number = 0;
    color: vec3;

    material_color_buffer: GPUBuffer;
    material_color_back_buffer: GPUBuffer;

    phong_material_bind_group: GPUBindGroup;

    constructor(name: string, texture?: Texture, color?: vec4, device?: GPUDevice) {
        super(name, texture, color, device);
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

        this.phong_material_bind_group = this.device.createBindGroup({
            layout: ShaderUtility.BindGroupLayoutList.phong_material_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.material_color_back_buffer }
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
    }

    setBindGroups(device: GPUDevice, passEncoder: GPURenderPassEncoder) {
        super.setBindGroups(device, passEncoder);
        passEncoder.setBindGroup(3, this.phong_material_bind_group);
    }

    encodeCommands(commandEncoder: GPUCommandEncoder) {
        super.encodeCommands(commandEncoder);
        commandEncoder.copyBufferToBuffer(this.material_color_buffer, 0, this.material_color_back_buffer, 0, 12);
    }
}
