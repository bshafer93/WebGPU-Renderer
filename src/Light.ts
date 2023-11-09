import { vec3, vec4 } from 'gl-matrix';
import Prop from './Prop';
import { ShaderUtility } from './ShaderUtilities';
import Transform from './Transform';

export enum LightType {
    SUN_LIGHT = 1,
    POINT_LIGHT = 2
}

/**
 * A custom light class
 */
export default class Light {
    name: string;
    transform: Transform;
    position: vec4;
    color: vec3;
    intensity: number;
    debug_prop: Prop;
    light_type: LightType;

    ambient_strength: number = 1.0;
    diffuse_strength: number = 1.0;
    specular_strength: number = 1.0;

    static light_struct_size = 48;
    static light_struct_size_f32 = 12;

    light_struct_array: Float32Array;

    light_bind_group: GPUBindGroup;
    light_intensity_bind_group: GPUBindGroup;
    light_transform_buffer: GPUBuffer;
    light_position_back_buffer: GPUBuffer;
    light_intensity_buffer: GPUBuffer;
    light_intensity_back_buffer: GPUBuffer;
    light_color_buffer: GPUBuffer;
    light_color_back_buffer: GPUBuffer;

    constructor(
        ambient_strength?: number,
        diffuse_strength?: number,
        specular_strength?: number,
        device?: GPUDevice,
        name?: string,
        translation?: vec3,
        color?: vec3,
        light_type?: LightType
    ) {
        this.transform = new Transform(null, translation, null);
        let tmpPos = this.transform.getPosition();
        this.position = vec4.fromValues(tmpPos[0], tmpPos[1], tmpPos[2], 1.0);
        this.name = name;
        this.color = color == null ? vec3.fromValues(1.0, 1.0, 1.0) : color;
        this.ambient_strength = ambient_strength == null ? 0.1 : ambient_strength;
        this.diffuse_strength = diffuse_strength == null ? 1.0 : diffuse_strength;
        this.specular_strength = specular_strength == null ? 1.0 : specular_strength;
        this.light_struct_array = new Float32Array(Light.light_struct_size_f32);
        this.light_type = light_type == null || undefined ? LightType.POINT_LIGHT : light_type;
    }
    /**
     * Initializes space on the GPU for the transform, intensity, and color matrices.
     *
     * @param device The gpu the buffers are to be sent to
     */
    initialize_Buffers(device: GPUDevice) {
        if (this.debug_prop) {
            this.debug_prop.initialize_Buffers(device);
        }
    }
    /**
     * Creates new buffer and copies the transform, intensity, and color matrices.
     * @param device The GPU to be used
     */
    buildBuffers(device: GPUDevice) {
        let tmpPos = this.transform.getPosition();
        this.position = vec4.fromValues(tmpPos[0], tmpPos[1], tmpPos[2], 1.0);
        if (this.debug_prop) {
            this.debug_prop.buildBuffers(device);
        }
    }

    buildLightStructBuffer() {
        let tmpPos = this.transform.getPosition();
        this.position = vec4.fromValues(tmpPos[0], tmpPos[1], tmpPos[2], 1.0);
        let amb_diff_spec_strength = vec3.fromValues(this.ambient_strength, this.diffuse_strength, this.specular_strength);
        this.light_struct_array.fill(0);
        this.light_struct_array.set(this.position, 0);
        this.light_struct_array.set(this.color, 4);
        this.light_struct_array.set(amb_diff_spec_strength, 8);
    }

    translate(loc: vec3) {
        this.transform.translate(loc);
        if (this.debug_prop) {
            this.debug_prop.transform.translate(loc);
        }
    }

    encodeCommands(commandEncoder: GPUCommandEncoder) {}
}
