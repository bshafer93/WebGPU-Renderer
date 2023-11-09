import { vec2 } from 'gl-matrix';

export enum MouseButtonName {
    left,
    middle,
    right,
    back,
    forward
}

/**
 * Control class that simplifies getting user input.
 */
export default class Control {
    mouse_sensitivity: number = 0.1;
    mouse_event: MouseEvent;
    mouse_active: boolean = false;
    key_map: Map<String, boolean>;
    mouse_initialized: boolean;
    mouse_buttons: Map<Number, boolean>;
    mouse_position: vec2;
    mouse_movement: vec2;
    last_mouse_position: vec2;
    last_mouse_movement: vec2;
    canvas: HTMLCanvasElement;
    document;

    keyDownHandler(event: KeyboardEvent) {
        this.key_map.set(event.code, true);
    }
    keyUpHandler(event: KeyboardEvent) {
        this.key_map.set(event.code, false);
    }
    mouseMoveHandler(event: MouseEvent) {
        this.mouse_position = vec2.set(this.mouse_position, event.clientX, event.clientY);
        if (this.mouse_active) {
            this.last_mouse_movement = vec2.copy(this.last_mouse_movement, this.mouse_movement);
            this.mouse_movement = vec2.set(this.mouse_movement, event.movementX, event.movementY);
        } else {
            vec2.set(this.mouse_movement, 0.0, 0.0);
        }

        this.mouse_event = event;
    }

    mouseDownHandler(event: MouseEvent) {
        this.mouse_buttons.set(event.button, true);
    }

    mouseUpHandler(event: MouseEvent) {
        this.mouse_buttons.set(event.button, false);
    }

    c_keyDownHandler = (event) => this.keyDownHandler(event);
    c_keyUpHandler = (event) => this.keyUpHandler(event);
    c_mouseMoveHandler = (event) => this.mouseMoveHandler(event);
    c_mouseDownHandler = (event) => this.mouseDownHandler(event);
    c_mouseUpHandler = (event) => this.mouseUpHandler(event);
    c_lockChangeAlert = () => this.lockChangeAlert();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.document = document;

        canvas.requestPointerLock = canvas.requestPointerLock;
        document.exitPointerLock = document.exitPointerLock;

        this.canvas.addEventListener(
            'click',
            () => {
                if (document.pointerLockElement == null) {
                    canvas.requestPointerLock();
                    this.mouse_active = true;
                }
            },
            false
        );

        document.addEventListener('pointerlockchange', this.c_lockChangeAlert, false);
        document.addEventListener('keydown', this.c_keyDownHandler, false);
        document.addEventListener('keyup', this.c_keyUpHandler, false);

        this.canvas.addEventListener('mousedown', this.c_mouseDownHandler, false);
        document.addEventListener('mouseup', this.c_mouseUpHandler, false);

        this.mouse_initialized = false;
        this.last_mouse_position = vec2.create();
        this.mouse_position = vec2.create();
        this.mouse_movement = vec2.create();
        this.last_mouse_movement = vec2.create();
        this.mouse_buttons = new Map();
        this.mouse_buttons.set(MouseButtonName.left, false);
        this.mouse_buttons.set(MouseButtonName.middle, false);
        this.mouse_buttons.set(MouseButtonName.right, false);
        this.mouse_buttons.set(MouseButtonName.back, false);
        this.mouse_buttons.set(MouseButtonName.forward, false);
        this.key_map = new Map();
        this.key_map.set('Escape', false);
        this.key_map.set('Digit1', false);
        this.key_map.set('Digit2', false);
        this.key_map.set('Digit3', false);
        this.key_map.set('Digit4', false);
        this.key_map.set('Digit5', false);
        this.key_map.set('Digit6', false);
        this.key_map.set('Digit7', false);
        this.key_map.set('Digit8', false);
        this.key_map.set('Digit9', false);
        this.key_map.set('Digit0', false);
        this.key_map.set('Minus', false);
        this.key_map.set('Equal', false);
        this.key_map.set('Backspace', false);
        this.key_map.set('Tab', false);
        this.key_map.set('KeyQ', false);
        this.key_map.set('KeyW', false);
        this.key_map.set('KeyE', false);
        this.key_map.set('KeyR', false);
        this.key_map.set('KeyT', false);
        this.key_map.set('KeyY', false);
        this.key_map.set('KeyU', false);
        this.key_map.set('KeyI', false);
        this.key_map.set('KeyO', false);
        this.key_map.set('KeyP', false);
        this.key_map.set('BracketLeft', false);
        this.key_map.set('BracketRight', false);
        this.key_map.set('Enter', false);
        this.key_map.set('Left', false);
        this.key_map.set('KeyA', false);
        this.key_map.set('KeyS', false);
        this.key_map.set('KeyD', false);
        this.key_map.set('KeyF', false);
        this.key_map.set('KeyG', false);
        this.key_map.set('KeyH', false);
        this.key_map.set('KeyJ', false);
        this.key_map.set('KeyK', false);
        this.key_map.set('KeyL', false);
        this.key_map.set('Semicolon', false);
        this.key_map.set('Quote', false);
        this.key_map.set('Backquote', false);
        this.key_map.set('ShiftLeft', false);
        this.key_map.set('Backslash', false);
        this.key_map.set('KeyZ', false);
        this.key_map.set('KeyX', false);
        this.key_map.set('KeyC', false);
        this.key_map.set('KeyV', false);
        this.key_map.set('KeyB', false);
        this.key_map.set('KeyN', false);
        this.key_map.set('KeyM', false);
        this.key_map.set('Comma', false);
        this.key_map.set('Period', false);
        this.key_map.set('Slash', false);
        this.key_map.set('ShiftRight', false);
        this.key_map.set('NumpadMultiply', false);
        this.key_map.set('AltLeft', false);
        this.key_map.set('Space', false);
        this.key_map.set('CapsLock', false);
        this.key_map.set('F1', false);
        this.key_map.set('F2', false);
        this.key_map.set('F3', false);
        this.key_map.set('F4', false);
        this.key_map.set('F5', false);
        this.key_map.set('F6', false);
        this.key_map.set('F7', false);
        this.key_map.set('F8', false);
        this.key_map.set('F9', false);
        this.key_map.set('F10', false);
        this.key_map.set('ArrowUp', false);
        this.key_map.set('ArrowDown', false);
        this.key_map.set('ArrowLeft', false);
        this.key_map.set('ArrowRight', false);
    }

    lockChangeAlert() {
        if (document.pointerLockElement !== null) {
            document.addEventListener('mousemove', this.c_mouseMoveHandler, false);
        } else {
            document.removeEventListener('mousemove', this.c_mouseMoveHandler, false);
            this.mouse_active = false;
            this.mouse_movement = vec2.set(this.mouse_movement, 0.0, 0.0);
        }
    }
}
