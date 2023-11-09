import { ShaderUtility } from './ShaderUtilities';

/**
 * Shader class helps set up the shaderpipe line.
 * Set's up multiple different pipeplines that can be used.
 */
export default class Shader {
    vertex_shader_module: GPUShaderModule;
    fragment_shader_module: GPUShaderModule;
    pipeline: GPURenderPipeline;
    device: GPUDevice;

    constructor(vertCodePath, fragCodePath, device: GPUDevice, BindGroupLayoutArray: Iterable<GPUBindGroupLayout>) {
        //Shaders
        const vertex_description = {
            code: vertCodePath
        };
        this.vertex_shader_module = device.createShaderModule(vertex_description);

        const fragment_description = {
            code: fragCodePath
        };
        this.fragment_shader_module = device.createShaderModule(fragment_description);

        this.device = device;

        this.createDefaultShader(BindGroupLayoutArray);
    }

    createDefaultShader(BindGroupLayoutArray: Iterable<GPUBindGroupLayout>) {
        const layout = this.device.createPipelineLayout({ bindGroupLayouts: BindGroupLayoutArray });
        //Depth
        const depthStencil: GPUDepthStencilState = ShaderUtility.DefaultConfigs.depthStencil;

        //Shader Stages
        const vertex: GPUVertexState = {
            module: this.vertex_shader_module,
            entryPoint: 'main',
            buffers: [
                ShaderUtility.DefaultConfigs.positionBufferDesc,
                ShaderUtility.DefaultConfigs.colorBufferDesc,
                ShaderUtility.DefaultConfigs.normalBufferDesc,
                ShaderUtility.DefaultConfigs.textCoordBufferDesc
            ]
        };

        const fragment: GPUFragmentState = {
            module: this.fragment_shader_module,
            entryPoint: 'main',
            targets: [ShaderUtility.DefaultConfigs.colorState]
        };

        //Rasterization
        const primitive: GPUPrimitiveState = {
            frontFace: 'cw',
            cullMode: 'none',
            topology: 'triangle-list'
        };

        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout,
            vertex,
            fragment,
            primitive,
            depthStencil
        };

        this.pipeline = this.device.createRenderPipeline(pipelineDesc);
    }

    createDefaultPBRShader(BindGroupLayoutArray: Iterable<GPUBindGroupLayout>) {
        const layout = this.device.createPipelineLayout({ bindGroupLayouts: BindGroupLayoutArray });
        //Depth
        const depthStencil: GPUDepthStencilState = ShaderUtility.DefaultConfigs.depthStencil;

        //Shader Stages
        const vertex: GPUVertexState = {
            module: this.vertex_shader_module,
            entryPoint: 'main',
            buffers: [
                ShaderUtility.DefaultConfigs.positionBufferDesc,
                ShaderUtility.DefaultConfigs.colorBufferDesc,
                ShaderUtility.DefaultConfigs.normalBufferDesc,
                ShaderUtility.DefaultConfigs.textCoordBufferDesc
            ]
        };

        const fragment: GPUFragmentState = {
            module: this.fragment_shader_module,
            entryPoint: 'main',
            targets: [ShaderUtility.DefaultConfigs.colorState]
        };

        //Rasterization
        const primitive: GPUPrimitiveState = {
            frontFace: 'cw',
            cullMode: 'none',
            topology: 'triangle-list'
        };

        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout,
            vertex,
            fragment,
            primitive,
            depthStencil
        };

        this.pipeline = this.device.createRenderPipeline(pipelineDesc);
    }
}
