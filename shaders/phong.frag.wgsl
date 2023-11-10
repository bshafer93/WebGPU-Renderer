//Adapted from https://learnopengl.com/Lighting/Basic-Lighting
struct VSOut {
    @builtin(position) prop_position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal:vec3<f32>,
    @location(2) texture_coord:vec2<f32>,
    @location(3) camera_position:vec4<f32>,
    @location(4) frag_world_position:vec3<f32>,
};


struct LightPosition{
    position:vec4<f32>,    
};


struct LightIntensity{
    intensity:vec3<f32>,      
};


struct LightColor{
    color:vec3<f32>,      
};


struct MaterialColor{
    color:vec3<f32>,
};

@group(2) @binding(0) var<uniform> lightPosition: LightPosition;

@group(2) @binding(1) var<uniform> lightIntensity: LightIntensity;

@group(2) @binding(2) var<uniform> lightColor: LightColor;

@group(3) @binding(0) var<uniform> materialColor: MaterialColor;


fn phong(light_position:vec4<f32> ,light_intensity:vec3<f32>,light_color:vec3<f32>,in:VSOut ) -> vec3<f32> {

    var fnormal:vec3<f32> = normalize(in.normal);    

    let ambientColor:vec3<f32>= vec3<f32>(1.0,1.0,1.0);

    let ambientStrength:f32 = 0.1;
    let ambient:vec3<f32> = ambientStrength * ambientColor;
    //Ambient Is the General brightness of all models.

    //Diffuse is light given off by a "real" light in the scene
    var lightDirection:vec3<f32> = normalize(light_position.xyz - in.frag_world_position);  
    var diff:f32 = max(dot(fnormal, lightDirection), 0.0);
    var diffuse:vec3<f32>  = diff * light_color;

    let specularStrength:f32 = 0.5;

    //This is calculation on world space, change if wanting to do it in view space
    let viewDir:vec3<f32>  = normalize(in.camera_position.xyz - in.frag_world_position);
    let reflectDir:vec3<f32>  = reflect(-lightDirection, fnormal);  

    //IF everything is in view*model space , then eye is always at (0,0,0)
    //Therefore - > let viewDir:vec3<f32>  = normalize(-in.frag_world_position);

    //Specular calc
    var spec:f32 = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    var specular:vec3<f32>  = specularStrength * spec * light_color;

    let result:vec3<f32> = (ambient + diffuse + specular) * materialColor.color;

    return result;
}

@fragment
fn main(in:VSOut) -> @location(0) vec4<f32> {
    //Phong
    return vec4<f32>(phong(lightPosition.position,lightIntensity.intensity,lightColor.color,in), 1.0);
}
