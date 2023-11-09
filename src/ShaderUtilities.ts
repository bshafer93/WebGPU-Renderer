import Shader from './Shader';
import { getTextContents } from './Utilities';

/**
 * A basic utility to organize shader code that can be reused among many of the pipelines.
 */
export namespace ShaderUtility {
    export class DefaultConfigs {
        private constructor() {}
        //Input Assembly
        static positionAttribDesc: GPUVertexAttribute = {
            shaderLocation: 0, // [[location(0)]]
            offset: 0,
            format: 'float32x3'
        };
        static colorAttribDesc: GPUVertexAttribute = {
            shaderLocation: 1, // [[location(1)]]
            offset: 0,
            format: 'float32x3'
        };

        static normalAttribDesc: GPUVertexAttribute = {
            shaderLocation: 2, // [[location(2)]]
            offset: 0,
            format: 'float32x3'
        };

        static textCoordAttribDesc: GPUVertexAttribute = {
            shaderLocation: 3, // [[location(3)]]
            offset: 0,
            format: 'float32x2'
        };

        static positionBufferDesc: GPUVertexBufferLayout = {
            attributes: [DefaultConfigs.positionAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        static colorBufferDesc: GPUVertexBufferLayout = {
            attributes: [DefaultConfigs.colorAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        static normalBufferDesc: GPUVertexBufferLayout = {
            attributes: [DefaultConfigs.normalAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        static textCoordBufferDesc: GPUVertexBufferLayout = {
            attributes: [DefaultConfigs.textCoordAttribDesc],
            arrayStride: 4 * 2, // sizeof(float) * 3
            stepMode: 'vertex'
        };
        //Color/Blend State
        static colorState: GPUColorTargetState = {
            format: 'bgra8unorm'
        };

        //Depth
        static depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        };
    }

    export class BindGroupLayoutList {
        static device: GPUDevice;

        static camera_bind_group_layout: GPUBindGroupLayout;
        static transform_bind_group_layout: GPUBindGroupLayout;
        static material_textured_bind_group_layout: GPUBindGroupLayout;
        static pbr_material_bind_group_layout: GPUBindGroupLayout;
        static blinnphong_material_bind_group_layout: GPUBindGroupLayout;
        static phong_material_bind_group_layout: GPUBindGroupLayout;
        static light_bind_group_layout: GPUBindGroupLayout;
        static multi_light_bind_group_layout: GPUBindGroupLayout;
        static config_bind_group_layout: GPUBindGroupLayout;

        private constructor() {}

        static initializeAllBindGroupLayouts(device: GPUDevice) {
            BindGroupLayoutList.device = device;

            BindGroupLayoutList.camera_bind_group_layout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0, //View Matrix
                        visibility: GPUShaderStage.VERTEX, //What shader it will be used in
                        buffer: { type: 'uniform' } //What type
                    },
                    {
                        binding: 1, //Projection Matrix
                        visibility: GPUShaderStage.VERTEX, //What shader it will be used in
                        buffer: { type: 'uniform' } //What type
                    },
                    {
                        binding: 2, //Cam_Position
                        visibility: GPUShaderStage.VERTEX, //What shader it will be used in
                        buffer: { type: 'uniform' } //What type
                    }
                ]
            });

            //Need to Adust this based on mesh materials...
            BindGroupLayoutList.transform_bind_group_layout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0, //Shader Location
                        visibility: GPUShaderStage.VERTEX, // Transform Uniform Buffer
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 1, //Normal Matrix
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, //What shader it will be used in
                        buffer: { type: 'uniform' } //What type
                    }
                ]
            });

            BindGroupLayoutList.material_textured_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: {
                            sampleType: 'float',
                            viewDimension: '2d',
                            multisampled: false
                        }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        sampler: {
                            type: 'filtering'
                        }
                    }
                ]
            });

            BindGroupLayoutList.pbr_material_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    }
                ]
            });

            BindGroupLayoutList.blinnphong_material_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    }
                ]
            });

            BindGroupLayoutList.phong_material_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    }
                ]
            });

            BindGroupLayoutList.light_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    }
                ]
            });

            BindGroupLayoutList.multi_light_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    }
                ]
            });

            BindGroupLayoutList.config_bind_group_layout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    }
                ]
            });
        }
    }

    /**Contains a list of shaders that can be used by the engine. */
    export class ShaderList {
        static PBR_Shader: Shader;
        static BlinnPhong_Shader: Shader;
        static PhongMultiLight_Shader: Shader;
        static Phong_Shader: Shader;
        static Default_Shader: Shader;
        static Textured_Shader: Shader;

        static async initializeShaders(device: GPUDevice) {
            const PBR_vs = await getTextContents('./shaders/StandardPBR.vert.wgsl');
            const PBR_frgs = await getTextContents('./shaders/StandardPBR.frag.wgsl');
            const blinnp_vs = await getTextContents('./shaders/BlinnPhong.vert.wgsl');
            const blinnp_frgs = await getTextContents('./shaders/BlinnPhong.frag.wgsl');
            const phong_multi_vs = await getTextContents('./shaders/Phong_MultiLight.vert.wgsl');
            const phong_multi_frgs = await getTextContents('./shaders/Phong_MultiLight.frag.wgsl');
            const phong_vs = await getTextContents('./shaders/Phong.vert.wgsl');
            const phong_frgs = await getTextContents('./shaders/Phong.frag.wgsl');
            const vt = await getTextContents('./shaders/textured.vert.wgsl');
            const v = await getTextContents('./shaders/noTexture.vert.wgsl');
            const ft = await getTextContents('./shaders/textured.frag.wgsl');
            const f = await getTextContents('./shaders/noTexture.frag.wgsl');

            this.Textured_Shader = new Shader(vt, ft, device, [
                ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.transform_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.material_textured_bind_group_layout
            ]);

            this.Default_Shader = new Shader(v, f, device, [
                ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.transform_bind_group_layout
            ]);

            this.PBR_Shader = new Shader(PBR_vs, PBR_frgs, device, [
                ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.transform_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.light_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.pbr_material_bind_group_layout
            ]);

            this.BlinnPhong_Shader = new Shader(blinnp_vs, blinnp_frgs, device, [
                ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.transform_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.light_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.blinnphong_material_bind_group_layout
            ]);

            this.PhongMultiLight_Shader = new Shader(phong_multi_vs, phong_multi_frgs, device, [
                ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.transform_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.multi_light_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.phong_material_bind_group_layout
            ]);

            this.Phong_Shader = new Shader(phong_vs, phong_frgs, device, [
                ShaderUtility.BindGroupLayoutList.camera_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.transform_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.light_bind_group_layout,
                ShaderUtility.BindGroupLayoutList.phong_material_bind_group_layout
            ]);
        }
    }
}
