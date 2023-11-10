
struct VSOut {
    @builtin(position) prop_position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal:vec3<f32>,
    @location(2) texture_coord:vec2<f32>,
    @location(3) camera_position:vec4<f32>,
};

struct LightPosition{
    position:vec4<f32>,    
};


struct LightIntensity{
    l:vec3<f32>,      
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

fn blinnPhong( lightPos:vec4<f32> ,position:vec3<f32>, n:vec3<f32> ) -> vec3<f32> { 

    let ambient:vec3<f32> = vec3<f32>(0.0,0.2,0.2) * vec3<f32>(0.1,0.1,0.1);
    let s:vec3<f32> = normalize( lightPos.xyz - position );
    let sDotN:f32 = max( dot(s,n), 0.0 );
    let diffuse:vec3<f32> = materialColor.color * sDotN;
    var spec:vec3<f32> = vec3<f32>(0.0,0.0,0.0);   

    if( sDotN > 0.0 ) {
        let v:vec3<f32> = normalize(-position.xyz);     
        let h:vec3<f32> = normalize( v + s );     
        spec = vec3<f32>(0.95,0.95,0.95) * pow( max( dot(h,n), 0.0 ), 180.0 );
    }   
    
    return ambient + vec3<f32>(0.0,0.8,0.8) * (diffuse + spec); 
}

@fragment
fn main(in:VSOut) -> @location(0) vec4<f32> {

    return vec4<f32>(blinnPhong(in.camera_position, 
    in.prop_position.xyz,
    in.normal), 1.0);
}
