import PrismaticEngine from './PrismaticEngine';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const prismatic = new PrismaticEngine(canvas, './resources/PlaneAndBall.gltf');

const remove_prop_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('removeProp');

remove_prop_button.onclick = () => {
    prismatic.stage.removeLastProp();
};

prismatic.initializeEngine().then(() => prismatic.render(0.0));
