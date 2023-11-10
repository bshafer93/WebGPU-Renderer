# Prismatic Engine

## Description

A simple experimental 3D renderer using WebGPU, typescript, and a bit of GLTF for importing objects. This was one of my senior projects I worked on right before graduating from LMU. This was never meant to be a fully functional program or library, but more of a research project for myself on WebGPU and graphics rendering pipeline.

## <center><img src="https://github.com/bshafer93/SeniorProject/blob/main/img/renderer_screenshot.PNG" width="800"></center>

## Getting Started

### Dependencies

-   [Chrome Canary](https://www.google.com/chrome/canary/)
    1. Type "chrome://flags" in the URL
    2. Enable the "Unsafe WebGPU"
    3. Please disable when not testing this project.
-   Node.Js
-   Git
-   [glmatrix](https://www.npmjs.com/package/gl-matrix)
-   [gltf-loader-ts](https://www.npmjs.com/package/gltf-loader-ts)

---

### Installing & Executing

```
1. git clone https://github.com/bshafer93/WebGPU-Renderer

2. cd SeniorProject

3. npm start

4. In Chrome Canary go to "http://127.0.0.1:8080"

5. Move around scene with WASD and hold left mouse button to look around.
```

---

## Authors

Contributors names and contact info

ex. Brent Shafer  
ex. [Github](https://github.com/bshafer93)

---

## Resources that helped me greatly through the project.

Either from great code snippets that helped parts get up and running or wonderful explanations on graphics rendering.

-   https://austin-eng.com/webgpu-samples
-   https://alain.xyz/blog/raw-webgpu
-   https://github.com/samdauwe/webgpu-native-examples
-   https://developer.nvidia.com/gpugems/gpugems/part-v-performance-and-practicalities/chapter-28-graphics-pipeline-performance
-   https://sotrh.github.io/learn-wgpu/beginner/tutorial3-pipeline/#writing-the-shaders
-   https://www.willusher.io/graphics/2020/06/20/0-to-gltf-bind-group

---

## License

Utah Teapot gathered from - https://sketchfab.com/3d-models/the-utah-teapot-1092c2832df14099807f66c8b792374d

This project is licensed under the unlicense License - see the LICENSE.md file for details

---

## Future Considerations

There are many things I'd love to do with this project which I list below.

-   More Lights
-   Bump Mapping
