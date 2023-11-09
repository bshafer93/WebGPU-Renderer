import { vec4, vec3 } from 'gl-matrix';
import Shader from './Shader';
import { ShaderUtility } from './ShaderUtilities';
import Texture from './Texture';
/**
 * Custom material class to be used with Props.
 */
export default class Material {
    name: string;
    diffuse: Texture;
    textured_material_bind_group: GPUBindGroup;
    defaultColor: vec4;
    color: vec3;
    textured: boolean;
    shader: Shader;
    device: GPUDevice;

    constructor(name: string, texture?: Texture, color?: vec4, device?: GPUDevice) {
        this.name = name;
        this.diffuse = texture;
        this.defaultColor = color;
        this.textured = false;
        this.device = device;
    }

    initializeBindGroup() {
        if (this.textured == true) {
            this.textured_material_bind_group = this.device.createBindGroup({
                layout: ShaderUtility.BindGroupLayoutList.material_textured_bind_group_layout,
                entries: [
                    {
                        binding: 0,
                        resource: this.diffuse.texture.createView()
                    },
                    {
                        binding: 1,
                        resource: this.diffuse.textureSample
                    }
                ]
            });
        }
    }

    setBindGroups(device: GPUDevice, passEncoder: GPURenderPassEncoder) {
        if (this.textured === true) {
            passEncoder.setBindGroup(2, this.textured_material_bind_group);
        }
    }

    buildBuffers(device: GPUDevice) {}

    encodeCommands(commandEncoder: GPUCommandEncoder) {}
}
