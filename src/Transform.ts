import { mat4, quat, vec3 } from 'gl-matrix';
import { DEGREES_TO_RADIANS } from './Utilities';

/**
 * Used to usually hold position information for props and lights on stage, but can also be used to store anything a 4x4 matrix would be used for.
 */
export default class Transform {
    matrix: mat4;
    matrix_buffer: GPUBuffer;

    constructor(qRotation?: quat, translation?: vec3, scale?: vec3, localOrigin?: vec3) {
        this.matrix = mat4.create();

        this.matrix = mat4.fromRotationTranslationScale(
            this.matrix,
            qRotation || quat.create(),
            translation || vec3.create(),
            scale || vec3.fromValues(1, 1, 1)
        );
    }

    /**
     *Builds the matrix buffer that the transform uses.
     * @param device GPU
     * @returns a newly created matrix buffer.
     */
    build_matrix_buffer(device: GPUDevice) {
        this.matrix_buffer = device.createBuffer({
            size: 16 * 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });

        {
            let map = new Float32Array(this.matrix_buffer.getMappedRange());
            map.set(this.matrix);
            this.matrix_buffer.unmap();
        }

        return this.matrix_buffer;
    }

    /**
     * Translates the transform.
     * @param loc Position to move to
     */
    translate(loc: vec3) {
        this.matrix = mat4.translate(this.matrix, this.matrix, loc);
    }

    /**
     *Rotates this tranform.
     * @param degrees degrees to rotate
     * @param axis axis to rotate given as a vec3.
     */
    rotate(degrees: number, axis: vec3) {
        this.matrix = mat4.rotate(this.matrix, this.matrix, DEGREES_TO_RADIANS(degrees), axis);
    }

    /**
     *
     * @returns vec3(x,y,z) position of this transform.
     */
    getPosition(): vec3 {
        let pos: vec3 = vec3.create();
        pos = mat4.getTranslation(pos, this.matrix);
        return pos;
    }
}
