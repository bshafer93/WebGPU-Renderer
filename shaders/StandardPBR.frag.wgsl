// PBR adapted from https://learnopengl.com/PBR/Lighting
struct VSOut {
    @builtin(position) prop_position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal:vec3<f32>,
    @location(2) texture_coord:vec2<f32>,
    @location(3) camera_position:vec3<f32>,
};


struct LightPosition{
    position:vec4<f32>,    
};


struct LightIntensity{
    l:vec3<f32>,      
};


struct MaterialColor{
    color:vec3<f32>,
};


struct MaterialRough{
    rough:f32,       
};


struct MaterialMetal{
    metal:f32,     
};

@group(2) @binding(0) var<uniform> lightPosition: LightPosition;

@group(2) @binding(1) var<uniform> lightIntensity: LightIntensity;

@group(3) @binding(0) var<uniform> materialColor: MaterialColor;

@group(3) @binding(1) var<uniform> materialRoughness: MaterialRough;

@group(3) @binding(2) var<uniform> materialMetallic: MaterialMetal;

fn fresnelSchlick( cosTheta:f32,f0:vec3<f32>) -> vec3<f32> {

    return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn GeometrySchlickGGX( ndotV:f32,  roughness:f32) -> f32
{
    let r:f32 = (roughness + 1.0);
    let k:f32 = (r*r) / 8.0;

    let num:f32   = ndotV;
    let denom:f32 = ndotV * (1.0 - k) + k;
	
    return num / denom;
}

fn GeometrySmith( n:vec3<f32>,  v:vec3<f32>, l:vec3<f32>, roughness:f32)->f32{
    let ndotV:f32 = max(dot(n, v), 0.0);
    let ndotL:f32 = max(dot(n, l), 0.0);
    let ggx2:f32  = GeometrySchlickGGX(ndotV, roughness);
    let ggx1:f32  = GeometrySchlickGGX(ndotL, roughness);
	
    return ggx1 * ggx2;
}

fn DistributionGGX( n:vec3<f32>,  h:vec3<f32>, roughness:f32)->f32{
    let PI:f32 = 3.14159265;

    let a:f32      = roughness*roughness;
    let a2:f32     = a*a;
    let ndotH:f32  = max(dot(n, h), 0.0);
    let ndotH2:f32 = ndotH*ndotH;
	
    let num:f32   = a2;
    var denom:f32 = (ndotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
	
    return num / denom;
}


@fragment
fn main(in:VSOut) -> @location(0) vec4<f32> {
    let PI:f32 = 3.14159265;
    var tempAlbedo:vec3<f32> = vec3<f32>(0.3,0.5,0.3); 
    var tempMetallic = 1.0;
    var tempRoughness = 0.1;
    var n = normalize(in.normal);
    var v = normalize(in.camera_position - in.prop_position.xyz);

    var f0:vec3<f32> = vec3<f32>(0.04,0.04,0.04);

    f0 = mix(f0,tempAlbedo,tempMetallic);

    var lo:vec3<f32> = vec3<f32>(0.0,0.0,0.0);
    

    //Adjust for more lights
    var l:vec3<f32> = normalize(lightPosition.position.xyz - in.prop_position.xyz);
    var h:vec3<f32> = normalize(v + l);
    var distance:f32    = length(lightPosition.position.xyz - in.prop_position.xyz);
    var attenuation:f32 = 1.0 / (distance * distance);
    var radiance:vec3<f32>     = vec3<f32>(1.0,1.0,1.0) * attenuation;  

    var ndf:f32 = DistributionGGX(n, h, tempRoughness);        
    var g:f32   = GeometrySmith(n, v, l, tempRoughness);      
    var f:vec3<f32>    = fresnelSchlick(max(dot(h, v), 0.0), f0);

    var kS:vec3<f32>  = f;
    var kD:vec3<f32>  = vec3<f32>(1.0,1.0,1.0) - kS;
    kD = kD*(1.0 - tempMetallic);	  

    var numerator:vec3<f32>   = ndf * g * f;
    var denominator:f32 = 4.0 * max(dot(n, v), 0.0) * max(dot(n, l), 0.0) + 0.0001;
    var specular:vec3<f32>     = numerator / denominator; 

    // add to outgoing radiance Lo
    var ndotL:f32 = max(dot(n, l), 0.0);                
    lo = lo + ((kD * tempAlbedo / PI + specular) * radiance * ndotL);  

    var ambient:vec3<f32> = vec3<f32>(0.03,0.03,0.03) * tempAlbedo * 1.0;
    var color:vec3<f32> = ambient + lo;
	let constGamma:f32 = 1.0/2.2;
    color = color / (color + vec3<f32>(1.0,1.0,1.0));
    color = pow(color, vec3<f32>(constGamma,constGamma,constGamma));  


    return vec4<f32>(color, 1.0);
}
