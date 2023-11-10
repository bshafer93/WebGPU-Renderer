
//Lighting Adapted from https://learnopengl.com/Lighting/Multiple-lights
const DIRECTIONAL_LIGHT:i32 = 1;
const POINT_LIGHT:i32 = 2;
const LIGHT_COUNT:i32 = 6;
const SHININESS_DEFAULT:f32 = 30.0;
const SPECULAR_STRENGTH_DEFAULT:f32 = 0.5;

const WHITE_COLOR:vec3<f32> = vec3<f32>(1.0,1.0,1.0);
const BLACK_COLOR:vec3<f32> = vec3<f32>(0.0,0.0,0.0);
const HIGH_NOON_SUN_COLOR:vec3<f32> = vec3<f32>(1.0,1.0,0.984);

const POINT_LIGHT_CONSTANT:f32 =1.0;
const POINT_LIGHT_QUADRATIC:f32 =0.032;
const POINT_LIGHT_LINEAR:f32 =0.09;




//Fake Normals
const CIRCLE_NORMALS_RADIUS:f32 = 0.05;
const CIRCLE_CENTER_COORDINATES:vec2<f32> = vec2<f32>(0.5,0.5);

const POINT_ORIGINS: array<vec2<f32>,81> = array<vec2<f32>,81>(
    vec2<f32>(0.1,0.1), vec2<f32>(0.2,0.1),vec2<f32>(0.3,0.1),vec2<f32>(0.4,0.1),vec2<f32>(0.5,0.1),vec2<f32>(0.6,0.1),vec2<f32>(0.7,0.1),vec2<f32>(0.8,0.1),vec2<f32>(0.9,0.1),
    vec2<f32>(0.1,0.2), vec2<f32>(0.2,0.2),vec2<f32>(0.3,0.2),vec2<f32>(0.4,0.2),vec2<f32>(0.5,0.2),vec2<f32>(0.6,0.2),vec2<f32>(0.7,0.2),vec2<f32>(0.8,0.2),vec2<f32>(0.9,0.2),
    vec2<f32>(0.1,0.3), vec2<f32>(0.2,0.3),vec2<f32>(0.3,0.3),vec2<f32>(0.4,0.3),vec2<f32>(0.5,0.3),vec2<f32>(0.6,0.3),vec2<f32>(0.7,0.3),vec2<f32>(0.8,0.3),vec2<f32>(0.9,0.3),
    vec2<f32>(0.1,0.4), vec2<f32>(0.2,0.4),vec2<f32>(0.3,0.4),vec2<f32>(0.4,0.4),vec2<f32>(0.5,0.4),vec2<f32>(0.6,0.4),vec2<f32>(0.7,0.4),vec2<f32>(0.8,0.4),vec2<f32>(0.9,0.4),
    vec2<f32>(0.1,0.5), vec2<f32>(0.2,0.5),vec2<f32>(0.3,0.5),vec2<f32>(0.4,0.5),vec2<f32>(0.5,0.5),vec2<f32>(0.6,0.5),vec2<f32>(0.7,0.5),vec2<f32>(0.8,0.5),vec2<f32>(0.9,0.5),
    vec2<f32>(0.1,0.6), vec2<f32>(0.2,0.6),vec2<f32>(0.3,0.6),vec2<f32>(0.4,0.6),vec2<f32>(0.5,0.6),vec2<f32>(0.6,0.6),vec2<f32>(0.7,0.6),vec2<f32>(0.8,0.6),vec2<f32>(0.9,0.6),
    vec2<f32>(0.1,0.7), vec2<f32>(0.2,0.7),vec2<f32>(0.3,0.7),vec2<f32>(0.4,0.7),vec2<f32>(0.5,0.7),vec2<f32>(0.6,0.7),vec2<f32>(0.7,0.7),vec2<f32>(0.8,0.7),vec2<f32>(0.9,0.7),
    vec2<f32>(0.1,0.8), vec2<f32>(0.2,0.8),vec2<f32>(0.3,0.8),vec2<f32>(0.4,0.8),vec2<f32>(0.5,0.8),vec2<f32>(0.6,0.8),vec2<f32>(0.7,0.8),vec2<f32>(0.8,0.8),vec2<f32>(0.9,0.8),
    vec2<f32>(0.1,0.9), vec2<f32>(0.2,0.9),vec2<f32>(0.3,0.9),vec2<f32>(0.4,0.9),vec2<f32>(0.5,0.9),vec2<f32>(0.6,0.9),vec2<f32>(0.7,0.9),vec2<f32>(0.8,0.9),vec2<f32>(0.9,0.9)
    );

struct VSOut {
    @builtin(position) prop_position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal:vec3<f32>,
    @location(2) texture_coord:vec2<f32>,
    @location(3) camera_position:vec4<f32>,
    @location(4) frag_world_position:vec3<f32>,
};

// Info on struct alignment
//https://sotrh.github.io/learn-wgpu/showcase/alignment/#alignment-of-uniform-and-storage-buffers
//https://www.w3.org/TR/WGSL/#alignment-and-size
//OffsetOfMember(S, MN) = roundUp(AlignOfMember(S, MN), OffsetOfMember(S, MN-1) + SizeOfMember(S, MN-1)

struct LightInfo {
    position:vec4<f32>,  //Offset:0         
    color:vec3<f32>,     //Offset:16(4:f32)  roundUp(AlignOfMember(S, color),       OffsetOfMember(S, position) + SizeOfMember(S, position))  : roundUp(16,0 + 16) = 16 
    intensity:vec3<f32>, //Offset:32(8:f32)   roundUp(AlignOfMember(S, intensity), OffsetOfMember(S, color) + SizeOfMember(S, color))        : roundUp(16, 16 + 12) = ceil(28/16) * 16 = 32
    //Intensity[0] = Ambient Strength, Intensity[1] = Diffuse Strength, Intensity[2] = Specular Strength, 
};
//LightInfo Align:16    max(AlignOfMember(position), AlignOfMember(color),AlignOfMember(intensity) )  = max(16,16,16) = 16 
//Size:48               roundUp(AlignOf(LightInfo), OffsetOfMember(intensity) + SizeOfMember(intensity)) = roundUp(16, 32 + 12 ) = ceil(44/16) * 16 = 48                     


//lights: @stride(48) array<LightInfo,16>,
struct LightsBuffer{
     lights: array<LightInfo,16>, //StrideOf(array<LightInfo[, N]>) = roundUp(AlignOf(LightInfo), SizeOf(LightInfo)) = roundUp(16,48) = ceil(48/16) * 16 = 48 
};

struct SunLightBuffer{
    sun_light:LightInfo,
};  


struct MaterialColor{
    color:vec3<f32>,
};


struct NormalUniform{
    matrix:mat4x4<f32>,
};


@group(1) @binding(1) var<uniform> normal_matrix: NormalUniform;

@group(2) @binding(0) var<uniform> sunLightBuffer:SunLightBuffer;

@group(2) @binding(1) var<uniform> lightsBuffer:LightsBuffer;

@group(3) @binding(0) var<uniform> materialColor: MaterialColor;


fn getNearestPoint(point:vec2<f32>)->vec2<f32>{
    var nearest_point:vec2<f32>=vec2<f32>(POINT_ORIGINS[0]);
    for(var i:i32; i < 81; i = i + 1){
       if(distance(point,POINT_ORIGINS[i]) <= distance(point,nearest_point) ){
           nearest_point = POINT_ORIGINS[i];
       }
    }

    return nearest_point;
}

fn circlePointToSpherePoint(point:vec2<f32>,origin:vec2<f32>,radius:f32)-> vec3<f32> {

    var y_coord:f32 = 0.0;
    let transformed_point:vec2<f32> =vec2<f32>(point.x - origin.x,point.y - origin.y  );
    y_coord = sqrt((radius * radius) - (transformed_point.x * transformed_point.x ) - (transformed_point.y * transformed_point.y ));


    return vec3<f32>(transformed_point.x,y_coord,transformed_point.y);
}

fn phong(light:LightInfo,in:VSOut ) -> vec3<f32> {

    var fnormal:vec3<f32> = normalize(in.normal);    

    let ambientColor:vec3<f32>= vec3<f32>(1.0,1.0,1.0);

    let ambientStrength:f32 = 0.1;
    let ambient:vec3<f32> = ambientStrength * ambientColor;
    //Ambient Is the General brightness of all models.

    //Diffuse is light given off by a "real" light in the scene
    var lightDirection:vec3<f32> = normalize(light.position.xyz - in.frag_world_position);  
    var diff:f32 = max(dot(fnormal, lightDirection), 0.0);
    var diffuse:vec3<f32>  = diff * light.color;

    let specularStrength:f32 = 0.5;

    //This is calculation on world space, change if wanting to do it in view space
    let viewDir:vec3<f32>  = normalize(in.camera_position.xyz - in.frag_world_position);
    let reflectDir:vec3<f32>  = reflect(-lightDirection, fnormal);  

    //IF everything is in view*model space , then eye is always at (0,0,0)
    //Therefore - > let viewDir:vec3<f32>  = normalize(-in.frag_world_position);

    //Specular calc
    var spec:f32 = pow(max(dot(viewDir, reflectDir), 0.0), SHININESS_DEFAULT);
    var specular:vec3<f32>  = specularStrength * spec * light.color;

    let result:vec3<f32> = ( ambient + diffuse + specular) * materialColor.color;
    //let result:vec3<f32> = ( ambient + diffuse + specular) * materialColor.color;

    return result;
}


fn phongPointLight(light:LightInfo,in:VSOut ) -> vec3<f32> {
    let TEXTURE_MAP_DEBUG_COLOR:vec3<f32> = vec3<f32>(in.texture_coord,0.0);

    var lightDirection:vec3<f32> = normalize(light.position.xyz - in.frag_world_position);
    var fnormal:vec3<f32> = normalize(in.normal);

    /*
    var bump_origin:vec2<f32> = getNearestPoint(in.texture_coord);
    if(distance(in.texture_coord,bump_origin) <= CIRCLE_NORMALS_RADIUS){
        var new_normal:vec3<f32> = circlePointToSpherePoint(in.texture_coord,bump_origin,CIRCLE_NORMALS_RADIUS);
        fnormal = (normal_matrix.matrix * vec4<f32>(new_normal, 0.0)).xyz;
        fnormal = normalize(fnormal).xyz;
    }
    */


    let viewDir:vec3<f32>  = normalize(in.camera_position.xyz - in.frag_world_position);
    let reflectDir:vec3<f32>  = reflect(-lightDirection, fnormal);

    //Attenuation
    let distance = length(light.position.xyz-in.frag_world_position);
    let attenuation:f32 =  1.0 / (POINT_LIGHT_CONSTANT + POINT_LIGHT_LINEAR * distance + POINT_LIGHT_QUADRATIC * (distance * distance));    
    //Diffuse
    var diffuse:vec3<f32>  =  max(dot(fnormal, lightDirection), 0.0) * light.color * materialColor.color;
    //Specular
    var specular:vec3<f32>  = light.intensity[2] * pow(max(dot(viewDir, reflectDir), 0.0), SHININESS_DEFAULT) * WHITE_COLOR;
    //Ambient
    let ambientStrength:f32 = light.intensity[0];
    var ambient:vec3<f32> = ambientStrength * (BLACK_COLOR);

    ambient = ambient * attenuation;
    diffuse = diffuse * attenuation;
    specular = specular * attenuation;


    let result:vec3<f32> = ( ambient + diffuse + specular);
    return result;
}

fn phongSunLight(light:LightInfo,in:VSOut ) -> vec3<f32> {
    var TEXTURE_MAP_DEBUG_COLOR:vec3<f32> = vec3<f32>(in.texture_coord,0.0);
    var lightDirection:vec3<f32> = normalize(light.position.xyz );
    var fnormal:vec3<f32> = normalize(in.normal);

    /*
    var bump_origin:vec2<f32> = getNearestPoint(in.texture_coord);
    if(distance(in.texture_coord,bump_origin) <= CIRCLE_NORMALS_RADIUS){
        var new_normal:vec3<f32> = circlePointToSpherePoint(in.texture_coord,bump_origin,CIRCLE_NORMALS_RADIUS);
        fnormal = (normal_matrix.matrix * vec4<f32>(new_normal, 0.0)).xyz;
        fnormal = normalize(fnormal).xyz;
    }
    */

    let viewDir:vec3<f32>  = normalize(in.camera_position.xyz - in.frag_world_position);
    let reflectDir:vec3<f32>  = reflect(-lightDirection, fnormal);    

    //Ambient
    let ambientStrength:f32 = light.intensity[0];
    let ambient:vec3<f32> = ambientStrength * (BLACK_COLOR);
    //Diffuse
    var diffuse:vec3<f32>  =  max(dot(fnormal, lightDirection), 0.0) * light.color * materialColor.color;
    //Specular
    var specular:vec3<f32>  = light.intensity[2] * pow(max(dot(viewDir, reflectDir), 0.0), SHININESS_DEFAULT) * WHITE_COLOR;

    let result:vec3<f32> = ( ambient + diffuse + specular);
    return result;
}


@fragment
fn main(in:VSOut) -> @location(0) vec4<f32> {
    var result:vec3<f32>  = vec3<f32>(0.0,0.0,0.0);

    result = result + phongSunLight(sunLightBuffer.sun_light,in);
    
   for(var i:i32; i < 5; i = i + 1){
        result = result + phongPointLight(lightsBuffer.lights[i],in);
    }

    return vec4<f32>(result, 1.0);
}
