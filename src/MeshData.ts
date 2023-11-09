import { vec3 } from 'gl-matrix';
import Material from './Material';

/**
 * A basic class to store a models data.
 */
class MeshData {
    vertices: Float32Array;
    indices: Uint16Array;
    normals: Float32Array;
    colors: Float32Array;
    text_coords: Float32Array;
    material: Material;

    color: vec3;

    vertex_buffer: GPUBuffer;
    color_buffer: GPUBuffer;
    index_buffer: GPUBuffer;
    normals_buffer: GPUBuffer;
    text_coords_buffer: GPUBuffer;

    constructor({
        vertices = undefined,
        indices = undefined,
        colors = undefined,
        text_coords = undefined,
        normals = undefined,
        material = undefined,
        color = vec3.fromValues(0, 0.9, 0.2)
    }) {
        this.vertices = vertices;
        this.normals = normals;
        this.indices = indices;
        this.colors = colors;
        this.text_coords = text_coords;
        this.material = material;
        this.color = color;

        if (colors == undefined) {
            let tempColors = [];
            const total_verts = this.vertices.length / 3;
            const single_step = 1.0 / total_verts;
            for (let i = 0; i < this.vertices.length / 3; i++) {
                tempColors.push(color[0], color[1], color[2]);
            }
            this.colors = new Float32Array(tempColors);
        }
    }

    buildBuffers(device: GPUDevice) {
        //Buffers
        const createBuffer = (arr: Float32Array | Uint16Array, usage: number) => {
            //Align to 4 bytes ()
            let desc = {
                size: (arr.byteLength + 3) & ~3,
                usage,
                mappedAtCreation: true
            };
            let buffer = device.createBuffer(desc);
            const writeArray = arr instanceof Uint16Array ? new Uint16Array(buffer.getMappedRange()) : new Float32Array(buffer.getMappedRange());
            writeArray.set(arr);
            buffer.unmap();
            return buffer;
        };

        this.vertex_buffer = this.vertices != undefined ? createBuffer(this.vertices, GPUBufferUsage.VERTEX) : null;
        this.color_buffer = this.colors != undefined ? createBuffer(this.colors, GPUBufferUsage.VERTEX) : null;
        this.index_buffer = this.indices != undefined ? createBuffer(this.indices, GPUBufferUsage.INDEX) : null;
        this.normals_buffer = this.normals != undefined ? createBuffer(this.normals, GPUBufferUsage.VERTEX) : null;
        this.text_coords_buffer = this.text_coords != undefined ? createBuffer(this.text_coords, GPUBufferUsage.VERTEX) : null;
        this.material.initializeBindGroup();
        this.material.buildBuffers(device);
    }
}

export default MeshData;
