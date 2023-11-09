import vertShaderCode from './shaders/triangle.vert.wgsl';
import fragShaderCode from './shaders/triangle.frag.wgsl';
import MeshData from './MeshData';
import Shader from './Shader';
import Camera from './Camera';
import Prop from './Prop';
import Texture from './Texture';
import { mat4, quat, vec3, vec2 } from 'gl-matrix';
import Control, { MouseButtonName } from './Control';
import { time } from 'console';
import { getNormalizedMousePosition, getTextContents } from './Utilities';
import GltfImporter from './GltfImporter';
import { readFileSync } from 'fs';
import { ShaderUtility } from './ShaderUtilities';
import Stage from './Stage';

/**
 * The main engine to run the renderer.
 * @remarks
 * This is the class that glues everything together.
 *
 */
export default class PrismaticEngine {
    rotationSpeed: number = 0.01;

    canvas: HTMLCanvasElement;
    //API Data Structures
    adapter: GPUAdapter;
    device: GPUDevice;
    queue: GPUQueue;
    camera: Camera;
    //Frame Backings
    context: GPUCanvasContext;
    colorTexture: GPUTexture;
    colorTextureView: GPUTextureView;
    depthTexture: GPUTexture;
    depthTextureView: GPUTextureView;

    //Resources
    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    shaders: Array<Shader>;
    vertModule: GPUShaderModule;
    fragModule: GPUShaderModule;
    pipeline: GPURenderPipeline;

    uniformBufferParams: GPUBuffer = null;
    bindGroupLayout: GPUBindGroupLayout = null;
    uniformBindGroup: GPUBindGroup = null;
    uniformBindGroupLayout: GPUBindGroupLayout;
    commandEncoder: GPUCommandEncoder;
    passEncoder: GPURenderPassEncoder;

    deltaTime: DOMHighResTimeStamp = 0.01;
    FPSElement: HTMLDivElement;
    MouseX: HTMLDivElement;
    MouseY: HTMLDivElement;

    stage: Stage;

    stage_file: string;

    props: Prop;

    controls: Control;

    constructor(canvas: HTMLCanvasElement, stage_file?: string) {
        this.canvas = canvas;
        this.stage_file = stage_file !== undefined ? stage_file : './resources/PlaneAndBall.gltf';
    }

    /**
     * This initializes the engine by...
     * Setting up the camera controls
     * Getting and setting up the canvas context
     * Initializing Bind Group Layouts
     * Initializing Shaders
     * Loading scene information from a gltf file.
     */
    async initializeEngine() {
        if (await this.initializeWebGPU()) {
            this.controls = new Control(this.canvas);
            this.resizeBackings();
            ShaderUtility.BindGroupLayoutList.initializeAllBindGroupLayouts(this.device);
            await ShaderUtility.ShaderList.initializeShaders(this.device);
            this.stage = await GltfImporter.LOAD_GLTF(this.device, this.stage_file);
            await this.initializeResources();
        }
    }

    /**
     * Startup webgpu
     * @returns if webgpu could start properly
     */
    async initializeWebGPU(): Promise<boolean> {
        try {
            //Entry to WebGPU
            const entry: GPU = navigator.gpu;
            if (!entry) {
                return false;
            }
            this.adapter = await entry.requestAdapter();
            this.device = await this.adapter.requestDevice();
            this.queue = this.device.queue;
        } catch (e) {
            console.error(e);
            return false;
        }

        return true;
    }

    /**
     * Sets up resources used in the scene.
     * Creates camera
     * Initializes lights
     * initializes props(Geometry/Textures)
     * Changes the first 2 props colors...
     *
     */
    async initializeResources() {
        this.stage.createPerspectiveCamera(this.canvas.width, this.canvas.height);

        //this.stage.buildDebugLights();

        for (let i = 0; i < this.stage.lights.length; i++) {
            this.stage.lights[i].initialize_Buffers(this.device);
        }

        for (let i = 0; i < this.stage.props.length; i++) {
            this.stage.props[i].initialize_Buffers(this.device);
        }

        this.stage.props[0].changeColor(vec3.fromValues(0.3, 0.5, 0.3));
        this.stage.props[0].transform.translate(vec3.fromValues(0.0, 0.0, 0.0));

        //this.stage.removePropByName('Sphere');

        this.stage.props[0].transform.rotate(-40, vec3.fromValues(1, 0, 0));
    }

    /**
     * Resizes swapchain if canvas changes...
     * Still needs work, doesn't work quite as expected.
     */
    resizeBackings() {
        //Swapchain
        if (!this.context) {
            this.context = this.canvas.getContext('webgpu');
            const canvasConfig: GPUCanvasConfiguration = {
                device: this.device,
                format: 'bgra8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
            };
            this.context.configure(canvasConfig);
        }

        const depthTextureDesc: GPUTextureDescriptor = {
            size: [this.canvas.width, this.canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };

        this.depthTexture = this.device.createTexture(depthTextureDesc);
        this.depthTextureView = this.depthTexture.createView();
    }

    /**
     * Once per frame, build all commands that need to be sent to the gpu for rendering.
     *
     */
    encodeCommands() {
        let colorAttachment: GPURenderPassColorAttachment = {
            view: this.colorTextureView,
            loadValue: { r: 0, g: 0, b: 0, a: 1 },
            storeOp: 'store'
        };

        const depthAttachment: GPURenderPassDepthStencilAttachment = {
            view: this.depthTextureView,
            depthLoadValue: 1,
            depthStoreOp: 'store',
            stencilLoadValue: 'load',
            stencilStoreOp: 'store'
        };

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment
        };

        renderPassDesc.colorAttachments[0].view = this.context.getCurrentTexture().createView();

        this.commandEncoder = this.device.createCommandEncoder();

        this.stage.encodeCommands(this.commandEncoder);

        //Encode drawing commands
        this.passEncoder = this.commandEncoder.beginRenderPass(renderPassDesc);

        this.stage.renderPass(this.passEncoder);

        this.passEncoder.endPass();

        this.queue.submit([this.commandEncoder.finish()]);
    }

    /**
     * Checks for input using Control class
     * Used to move Camera around scene.
     * @param deltaTime deltatime used to help smooth out scene animations and camera movement.
     */
    checkInput(deltaTime) {
        this.flying_camera_controls();

        //Temporary way to move lighting around the stage
        if (this.controls.key_map.get('ArrowUp') === true) {
            this.stage.sun_light.translate(vec3.fromValues(0, 0, deltaTime));
        }

        if (this.controls.key_map.get('ArrowDown') === true) {
            this.stage.sun_light.translate(vec3.fromValues(0, 0, -deltaTime));
        }

        if (this.controls.key_map.get('ArrowRight') === true) {
            this.stage.sun_light.translate(vec3.fromValues(deltaTime, 0, 0));
        }

        if (this.controls.key_map.get('ArrowLeft') === true) {
            this.stage.sun_light.translate(vec3.fromValues(-deltaTime, 0, 0));
        }
    }

    flying_camera_controls() {
        if (this.controls.mouse_active) {
            //Changing Movement
            if (this.controls.mouse_initialized === false) {
                this.controls.last_mouse_position = vec2.copy(this.controls.last_mouse_position, this.controls.mouse_position);
                this.controls.mouse_initialized = true;
            }

            let x_offset = this.controls.mouse_movement.at(0);
            let y_offset = -this.controls.mouse_movement.at(1);

            if (vec2.equals(this.controls.mouse_movement, this.controls.last_mouse_movement)) {
                x_offset = 0.0;
                y_offset = 0.0;
            }

            this.controls.last_mouse_position = vec2.copy(this.controls.last_mouse_position, this.controls.mouse_position);
            x_offset *= this.controls.mouse_sensitivity;
            y_offset *= this.controls.mouse_sensitivity;
            this.stage.camera.pitchAndYaw(y_offset, x_offset);
        }

        if (this.controls.key_map.get('KeyW') === true) {
            this.stage.camera.moveForward(this.deltaTime);
        }

        if (this.controls.key_map.get('KeyS') === true) {
            this.stage.camera.moveForward(this.deltaTime * -1);
        }

        if (this.controls.key_map.get('KeyA') === true) {
            this.stage.camera.moveRight(this.deltaTime * -1);
        }

        if (this.controls.key_map.get('KeyD') === true) {
            this.stage.camera.moveRight(this.deltaTime * 1);
        }
    }

    /**
     * runs for every frame.
     * @param timestamp
     */
    render = (timestamp: DOMHighResTimeStamp) => {
        const startTime = performance.now();
        this.checkInput(this.deltaTime);
        //Acquire next image from context
        this.colorTexture = this.context.getCurrentTexture();
        this.colorTextureView = this.colorTexture.createView();

        this.stage.props[0].transform.rotate(1 * this.deltaTime, vec3.fromValues(0, 1, 0));
        this.stage.lights[1].transform.translate(vec3.fromValues(this.deltaTime, 0, 0));
        let current_position = this.stage.lights[1].transform.getPosition();
        let move_amount = vec3.fromValues(5 + Math.sin(this.deltaTime * 0.75), 0, 0);
        move_amount = vec3.scale(move_amount, move_amount, 4);
        this.stage.lights[1].transform.translate(move_amount);

        this.stage.buildAllBuffers();

        //Write and submit commands to queue
        this.encodeCommands();

        //Refresh canvas
        requestAnimationFrame(this.render);
        const stopTime = performance.now();
        this.deltaTime = stopTime - startTime;
    };
}
