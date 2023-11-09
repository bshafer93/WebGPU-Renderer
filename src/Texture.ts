/**
 * A basic class that holds information regarding textures to be used.
 */
export default class Texture {
    name: string;
    texture: GPUTexture;
    textureSample: GPUSampler;
    width: number;
    height: number;

    /**
     * Loads the image into the GPU
     * Lots of details are hard-coded now, but wouldst be difficult to make a child class override it to make a more custom texture class.
     * @param img_path Path to image file
     * @param device  GPU
     */
    async loadTexture(img_path: string, device: GPUDevice) {
        //Only gonna work for png's atm
        let imageTexture = new Image();
        imageTexture.src = img_path;
        await imageTexture.decode();
        let imageBitMap = await createImageBitmap(imageTexture);
        this.width = imageTexture.naturalWidth;
        this.height = imageTexture.naturalHeight;

        const textureSize: GPUExtent3D = {
            width: this.width,
            height: this.height,
            depthOrArrayLayers: 1
        };

        const textureDesc: GPUTextureDescriptor = {
            size: textureSize,
            dimension: '2d',
            format: 'rgba8unorm-srgb',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        };

        this.texture = device.createTexture(textureDesc);

        this.textureSample = device.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'nearest',
            minFilter: 'nearest'
        });

        //Copy image data to GPU
        device.queue.copyExternalImageToTexture(
            {
                source: imageBitMap
            },
            {
                texture: this.texture,
                mipLevel: 0
            },
            textureSize
        );
    }
}
