
struct VSOut {
    [[builtin(position)]] prop_position: vec4<f32>;
    [[location(0)]] color: vec3<f32>;
    [[location(1)]] normal:vec3<f32>;
    [[location(2)]] texture_coord:vec2<f32>;
};

[[stage(fragment)]]
fn main(in:VSOut) -> [[location(0)]] vec4<f32> {
    
            let lightPos: vec3<f32> = vec3<f32>(5.0,5.0,0.0);
            let norm: vec3<f32> = vec3<f32>(normalize(in.normal));
            let ambientStrength:f32 =  0.5;
            let lightColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
            let ambient:vec3<f32> = ambientStrength * lightColor;
            let lightVector:vec3<f32> = normalize(lightPos - in.prop_position.xyz);

            let diff:f32 = max(dot(norm, lightVector), 0.0);
            let diffuse:vec3<f32> = diff * lightColor;
            var result:vec3<f32> = (ambient + diffuse) * in.color;


    return vec4<f32>(result, 0.3);
}
