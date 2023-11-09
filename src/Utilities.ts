import { mat4, vec2, vec3 } from 'gl-matrix';
import { createBrotliCompress } from 'zlib';

//Adapted from https://sotrh.github.io/learn-wgpu/beginner/tutorial6-uniforms/#a-perspective-camera

export const OPENGL_TO_WGPU_MATRIX: mat4 = mat4.fromValues(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5, 1.0);

/**
 * Normalizes the mouse position from the canvas.
 * @param canvas
 * @param mouse_position
 * @returns the normalized mouse position
 */
export function getNormalizedMousePosition(canvas: HTMLCanvasElement, mouse_position: vec2): vec2 {
    const mousex = mouse_position.at(0);
    const mousey = mouse_position.at(1);
    const rect = canvas.getBoundingClientRect();
    const normalized_x = 2 * (mousex / rect.width) - 1;
    const normalized_y = -(2 * (mousey / rect.height) - 1);

    return vec2.fromValues(normalized_x, normalized_y);
}
//Colors gathered from http://planetpixelemporium.com/tutorialpages/light.html
export class Vec3Color {
    static WHITE: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    static BLACK: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    static RED: vec3 = vec3.fromValues(1.0, 0.0, 0.0);
    static GREEN: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
    static BLUE: vec3 = vec3.fromValues(0.0, 0.0, 1.0);

    //Based Off Color Temperature
    static CANDLE: vec3 = vec3.fromValues(1.0, 0.576, 0.16); //1900k
    static TUNGSTEN: vec3 = vec3.fromValues(1.0, 0.839, 0.6673); //2850k
    static HALOGEN: vec3 = vec3.fromValues(1.0, 0.945, 0.878); //3200k
    static NOONSUN: vec3 = vec3.fromValues(1.0, 1.0, 0.984); //5400k
    static OVERCASTSUN: vec3 = vec3.fromValues(0.788, 0.886, 1.0); //7000k
    static CLEARSKY: vec3 = vec3.fromValues(0.25, 0.611, 1.0); //20000k
}

export const DEGREES_TO_RADIANS = (deg) => (deg * Math.PI) / 180.0;

/**
 * Asynchronously read text from a given file.
 * @param filePath File to read
 * @returns the file contents as a string.
 */
export async function getTextContents(filePath: string) {
    return await fetch(filePath)
        .then((response) => response.text())
        .then((textString) => {
            return textString;
        });
}
