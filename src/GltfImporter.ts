import { glMatrix, mat4, vec2, vec3, quat, vec4 } from 'gl-matrix';
import { GltfLoader } from 'gltf-loader-ts';
import MeshData from './MeshData';
import Prop from './Prop';
import Material from './Material';
import Texture from './Texture';
import Stage from './Stage';
import PBRMaterial from './PBRMaterial';
import BlinnPhongMaterial from './BlinnPhongMaterial';
import PhongMaterial from './PhongMaterial';
import { ShaderUtility } from './ShaderUtilities';

/**
 * A custom gltf import class built on top of gltf-loader-ts
 */
export default class GltfImporter {
    props: Prop[]; // Contains all objects on stage
    meshes: MeshData[][]; // Contains meshes used by Props
    materials: Material[]; //Contains all materials used by props
    device: GPUDevice;

    constructor(device: GPUDevice) {
        this.device = device;
    }

    createBuffer(arr: Float32Array | Uint16Array, usage: number) {
        //Align to 4 bytes ()
        let desc = {
            size: (arr.byteLength + 3) & ~3,
            usage,
            mappedAtCreation: true
        };
        let buffer = this.device.createBuffer(desc);
        const writeArray = arr instanceof Uint16Array ? new Uint16Array(buffer.getMappedRange()) : new Float32Array(buffer.getMappedRange());
        writeArray.set(arr);
        buffer.unmap();
        return buffer;
    }

    /**
     * Loads a GLTF file as a Stage.
     * @param device GPU
     * @param file_path Path of gltf file
     * @returns Stage, or in other nomenclature, a scene.
     */
    static async LOAD_GLTF(device: GPUDevice, file_path: string): Promise<Stage> {
        let loader = new GltfLoader();
        let uri = file_path;
        let asset = await loader.load(uri);
        
        let gltf = asset.gltf;
        const prop_count: number = gltf.scenes[0].nodes.length;
        const mesh_count: number = gltf.meshes.length;
        const material_count: number = gltf.materials.length;
        let props = new Array<Prop>(prop_count);
        let meshes = new Array<MeshData[]>(mesh_count);
        let materials = new Array<Material | PBRMaterial>(material_count);

        console.log(`Total Props:${prop_count}`);
        console.log(`Total Meshes:${mesh_count}`);
        console.log(`Total Materials:${mesh_count}`);

        for (let i = 0; i < material_count; i++) {
            //console.log(`Material:${i}:-----------------------------------------------------------------------`);
            materials[i] = new PhongMaterial(gltf.materials[i].name, null, vec4.fromValues(0.5, 0.5, 0.5, 1), device);

            if ('baseColorTexture' in gltf.materials[i].pbrMetallicRoughness) {
                console.log(`PBR_Textured_Shader Added`);
                materials[i].shader = ShaderUtility.ShaderList.Textured_Shader;
                materials[i].textured = true;
                const texture_index = gltf.materials[i].pbrMetallicRoughness.baseColorTexture.index;
                const image_index = gltf.textures[texture_index].source;
                const image_type = gltf.images[image_index].mimeType;
                const image_name = gltf.images[image_index].uri;

                const full_img_path = './resources/' + image_name;
                materials[i].diffuse = new Texture();
                await materials[i].diffuse.loadTexture(full_img_path, device);
            } else if ('baseColorFactor' in gltf.materials[i].pbrMetallicRoughness) {
                console.log(`Non_Textured_Shader Added`);
                const r = gltf.materials[i].pbrMetallicRoughness.baseColorFactor[0];
                const g = gltf.materials[i].pbrMetallicRoughness.baseColorFactor[1];
                const b = gltf.materials[i].pbrMetallicRoughness.baseColorFactor[2];
                const a = gltf.materials[i].pbrMetallicRoughness.baseColorFactor[3];
                materials[i].defaultColor = vec4.fromValues(r, g, b, a);
            } else {
                console.log(`Non_PBR_Shader Added`);
                materials[i].defaultColor = vec4.fromValues(0.0, 0.4, 0.3, 1.0);
            }
            if (materials[i] instanceof PBRMaterial) {
                console.log(`PBR_Shader_Properties Adjusted`);
                materials[i].metallic = gltf.materials[i].pbrMetallicRoughness.metallicFactor;
                materials[i].roughness = gltf.materials[i].pbrMetallicRoughness.roughnessFactor;
            }
            materials[i].shader = ShaderUtility.ShaderList.PhongMultiLight_Shader;

            //console.log(`---------------------------------${gltf.materials[i].name}:-----------------------------------------------------------------------`);
        }

        for (let i = 0; i < mesh_count; i++) {
            //console.log(`Mesh${i}:-----------------------------------------------------------------------`);

            let mesh_primitive_array = new Array<MeshData>(gltf.meshes[i].primitives.length);

            for (let j = 0; j < gltf.meshes[i].primitives.length; j++) {
                const vertex_index_accessor = gltf.meshes[i].primitives[j].attributes['POSITION'];

                const normal_index_accessor = gltf.meshes[i].primitives[j].attributes['NORMAL'];

                const uv_index_accessor = gltf.meshes[i].primitives[j].attributes['TEXCOORD_0'];

                const indices_index_accessor = gltf.meshes[i].primitives[j].indices;

                const material_index = gltf.meshes[i].primitives[j].material;

                let raw_data = new Uint8Array(await asset.accessorData(vertex_index_accessor));
                let vertex_data_f32 = new Float32Array(raw_data.buffer);
                raw_data = new Uint8Array(await asset.accessorData(normal_index_accessor));
                let normal_data_f32 = new Float32Array(raw_data.buffer);
                raw_data = new Uint8Array(await asset.accessorData(uv_index_accessor));
                let uv_data_f32 = new Float32Array(raw_data.buffer);
                raw_data = new Uint8Array(await asset.accessorData(indices_index_accessor));
                let indices_data_u16 = new Uint16Array(raw_data.buffer);

                mesh_primitive_array[j] = new MeshData({
                    vertices: vertex_data_f32,
                    indices: indices_data_u16,
                    colors: undefined,
                    text_coords: uv_data_f32,
                    normals: normal_data_f32,
                    material: materials[material_index],
                    color: vec3.fromValues(0, 0.3, 0.4)
                });
            }
            meshes[i] = mesh_primitive_array;
            //console.log(`------------------------------------------:${gltf.nodes[i].name}:---------------------------------------------------`);
        }

        for (let i = 0; i < prop_count; i++) {
            //console.log(`Prop${i}:-----------------------------------------------------------------------`);
            let qRotation =
                gltf.nodes[i].rotation != null || gltf.nodes[i].rotation != undefined
                    ? quat.fromValues(gltf.nodes[i].rotation[0], gltf.nodes[i].rotation[1], gltf.nodes[i].rotation[2], gltf.nodes[i].rotation[3])
                    : undefined;
            let scale =
                gltf.nodes[i].scale != null || gltf.nodes[i].scale != undefined
                    ? vec3.fromValues(gltf.nodes[i].scale[0], gltf.nodes[i].scale[1], gltf.nodes[i].scale[2])
                    : undefined;
            let translation =
                gltf.nodes[i].translation != null || gltf.nodes[i].translation != undefined
                    ? vec3.fromValues(gltf.nodes[i].translation[0], gltf.nodes[i].translation[1], gltf.nodes[i].translation[2])
                    : undefined;
            const prop_mesh_index = gltf.nodes[i].mesh;
            const prop_name = gltf.nodes[i].name;
            props[i] = new Prop(meshes[prop_mesh_index], device, prop_name, i, qRotation, translation, scale);

            //console.log(`---------------------------------${gltf.nodes[i].name}:-----------------------------------------------------------------------`);
        }

        for (let i = 0; i < prop_count; i++) {
            console.log('Prop:' + props[i].name);
        }

        return new Stage(device, props, meshes, materials);
    }

    static async LOAD_GLTF_TO_SCENE() {}
}
