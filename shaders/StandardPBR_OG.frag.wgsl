
struct VSOut {
    [[builtin(position)]] prop_position: vec4<f32>;
    [[location(0)]] color: vec3<f32>;
    [[location(1)]] normal:vec3<f32>;
    [[location(2)]] texture_coord:vec2<f32>;
};

[[block]]
struct LightPosition{
    position:vec4<f32>;    
};

[[block]]
struct LightIntensity{
    l:vec3<f32>;      
};

[[block]]
struct MaterialColor{
    color:vec3<f32>;
};

[[block]]
struct MaterialRough{
    rough:f32;       
};

[[block]]
struct MaterialMetal{
    metal:f32;     
};

[[group(2), binding(0)]]
var<uniform> lightPosition: LightPosition;

[[group(2), binding(1)]]
var<uniform> lightIntensity: LightIntensity;

[[group(3), binding(0)]]
var<uniform> materialColor: MaterialColor;

[[group(3), binding(1)]]
var<uniform> materialRoughness: MaterialRough;

[[group(3), binding(2)]]
var<uniform> materialMetallic: MaterialMetal;

fn schlickFresnel(lDotH: f32) -> vec3<f32> {

    var f0 = vec3<f32>(0.04,0.04,0.04);

    if(materialMetallic.metal == 1.0){
        f0 = materialColor.color;
    }
    
  let oneminf0:vec3<f32> = vec3<f32>(1.0-f0.x,1.0-f0.y,1.0-f0.z);
  return f0+(oneminf0) * pow(1.0 - lDotH,5.0);
}

fn geomSmith(dotProd:f32)->f32{
    //var k = (materialInfo.rough + 1.0) * (materialInfo.rough + 1.0)/ 8.0;
    var k = (0.5 + 1.0) * (0.5 + 1.0) / 8.0;
    var denom = dotProd * (1.0-k)+k;
    return (1.0 / denom); 
}

fn ggxDistribution(nDotH:f32)->f32{
    let PI:f32 = 3.14159265;
    //var alpha2 = materialInfo.rough * materialInfo.rough * materialInfo.rough;
    let alpha2 = 0.125;
    let d:f32 = (nDotH * nDotH) * (alpha2 - 1.0) + 1.0;
    return alpha2 / (PI * d * d);
}


fn microfacetModel(lightIndex:i32,pos:vec3<f32>,n:vec3<f32>) -> vec3<f32>{
    let PI:f32 = 3.14159265;
    var diffuseBrdf:vec3<f32> = vec3<f32>(0.0,0.0,0.0);
    if(materialMetallic.metal == 1.0){
        diffuseBrdf = materialColor.color;
    }
    var l = vec3<f32>(0.0,0.0,0.0);
    //WILL NEEDTO CHANGE WHEN I ADD MORE LIGHTS!
    var lightI = lightIntensity.l;
    //var lightPos:vec4<f32> = lightPosition.position * vec4<f32>(0.0,0.0,0.0, 0.0);
    let lightPos:vec4<f32> = vec4<f32>(5.0,5.0,0.0, 1.0);

    if(lightPos.w == 0.0){
        //Directional Light
        l = normalize(lightPos.xyz);
    }else{
        //Positional light
        l = lightPos.xyz - pos;
        var dist = length(l);
        l = normalize(l);
        lightI = lightI/(dist * dist);
    }

    var v:vec3<f32> = normalize(-pos);                //Direction towards Viewer/Camera
    var h:vec3<f32> = normalize(v + 1.0);             //Vection halfway b/w l and v
    var nDotH:f32 = dot(n,h);                         
    var lDotH:f32 = dot(l,h);
    var nDotL:f32 =  max(dot(n,l),0.0);
    var nDotV:f32 = dot(n,v);

    var specBrdf:vec3<f32> = 0.25 * ggxDistribution(nDotH) * schlickFresnel(lDotH) * geomSmith(nDotL) * geomSmith(nDotV);
    return (diffuseBrdf + PI * specBrdf) * lightI * nDotL;
    
}


[[stage(fragment)]]
fn main(in:VSOut) -> [[location(0)]] vec4<f32> {

    var sum = vec3<f32>(0.0,0.0,0.0);
    var n = normalize(in.normal);

    //MICROfacet start
    let PI:f32 = 3.14159265;
    var diffuseBrdf:vec3<f32> = vec3<f32>(0.3,0.2,0.6);

    var l = vec3<f32>(0.0,0.0,0.0);
    //var lightI = lightIntensity.l;
    var lightI = lightIntensity.l;
    let lightPos:vec4<f32> = lightPosition.position;

    //Light Position
    l = lightPos.xyz - in.prop_position.xyz;
    var dist = length(l);
    l = normalize(l);
    lightI = lightI/(dist * dist); 

    var v:vec3<f32> = normalize(-in.prop_position.xyz);
    var h:vec3<f32> = normalize(v + 1.0);
    var nDotH:f32 = dot(n,h);
    var lDotH:f32 = dot(l,h);
    var nDotL:f32 =  max(dot(n,l),0.0);
    var nDotV:f32 = dot(n,v);

    var specBrdf:vec3<f32> = 0.25 * ggxDistribution(nDotH) * schlickFresnel(lDotH) * geomSmith(nDotL) * geomSmith(nDotV);

    //END MICRO
    sum = sum + ((diffuseBrdf + PI * specBrdf) * lightI * nDotL);

    //Gamma correction...
    let constGamma:f32 = 1.0/2.2;
    sum = pow(sum,vec3<f32>(constGamma,constGamma,constGamma));

    return vec4<f32>(sum, 1.0);
}
