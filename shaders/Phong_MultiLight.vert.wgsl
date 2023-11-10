
//Adapted https://learnopengl.com/Lighting/Basic-Lighting


struct VSOut {
    @builtin(position) prop_position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal:vec3<f32>,
    @location(2) texture_coord:vec2<f32>,
    @location(3) camera_position:vec4<f32>,
    @location(4) frag_world_position:vec3<f32>,
};



struct ViewUniform{
    view:mat4x4<f32>,
};


struct CamPosUniform{
    position:vec3<f32>,
};


struct ProjectionUniform{
    projection:mat4x4<f32>,
};


struct ModelUniform{
    model:mat4x4<f32>,
};


struct NormalUniform{
    matrix:mat4x4<f32>,
};


@group(0) @binding(0) var<uniform> view: ViewUniform;

@group(0) @binding(1) var<uniform> projection: ProjectionUniform;

@group(0) @binding(2) var<uniform> cam_pos: CamPosUniform;

@group(1) @binding(0) var<uniform> model: ModelUniform;

@group(1) @binding(1) var<uniform> normal_matrix: NormalUniform;



@vertex
fn main(@location(0) inPos: vec3<f32>,
        @location(1) inColor: vec3<f32>,
        @location(2) inNormal:vec3<f32>,
        @location(3) tex_coord:vec2<f32>) -> VSOut {
    var vsOut: VSOut;
    vsOut.prop_position =  projection.projection * view.view * model.model * vec4<f32>(inPos, 1.0);
    vsOut.color = inColor;
    vsOut.texture_coord = tex_coord;

    vsOut.normal = (normal_matrix.matrix * vec4<f32>(inNormal, 0.0)).xyz;

    vsOut.camera_position = vec4<f32>(cam_pos.position,1.0);
    vsOut.frag_world_position = (model.model * vec4<f32>(inPos, 1.0)).xyz;
    return vsOut;
}