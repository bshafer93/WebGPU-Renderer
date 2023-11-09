
//Adapted fromOPENGL 4 PBR shader code...


struct VSOut {
    [[builtin(position)]] prop_position: vec4<f32>;
    [[location(0)]] color: vec3<f32>;
    [[location(1)]] normal:vec3<f32>;
    [[location(2)]] texture_coord:vec2<f32>;
    [[location(3)]] camera_position:vec4<f32>;
};


[[block]]
struct ViewUniform{
    view:mat4x4<f32>;
};

[[block]]
struct CamPosUniform{
    position:vec3<f32>;
};

[[block]]
struct ProjectionUniform{
    projection:mat4x4<f32>;
};

[[block]]
struct ModelUniform{
    model:mat4x4<f32>;
};


[[group(0), binding(0)]]
var<uniform> view: ViewUniform;

[[group(0), binding(1)]]
var<uniform> projection: ProjectionUniform;

[[group(0), binding(2)]]
var<uniform> cam_pos: CamPosUniform;

[[group(1), binding(0)]]
var<uniform> model: ModelUniform;



[[stage(vertex)]]
fn main([[location(0)]] inPos: vec3<f32>,
        [[location(1)]] inColor: vec3<f32>,
        [[location(2)]] inNormal:vec3<f32>,
        [[location(3)]] tex_coord:vec2<f32>) -> VSOut {
    var vsOut: VSOut;
    vsOut.prop_position =  projection.projection * view.view * model.model * vec4<f32>(inPos, 1.0);
    vsOut.color = inColor;
    vsOut.texture_coord = tex_coord;
    vsOut.normal = vec3<f32>( (projection.projection * view.view * model.model * vec4<f32>(inNormal,0.0)).xyz);
    vsOut.camera_position = projection.projection * view.view * vec4<f32>(0.0,10.0,0.0,1.0);
    return vsOut;
}