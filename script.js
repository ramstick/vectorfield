var vectors_canvas;
var particles_canvas;
var overlay_canvas;

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var minX = -10;
var maxX = 10;
var minY = -HEIGHT / WIDTH * (maxX - minX) / 2;
var maxY = HEIGHT / WIDTH * (maxX - minX) / 2;

var STEP_X = 1;
var STEP_Y = 1;

var MAX_LENGTH = Math.sqrt(STEP_X * STEP_X + STEP_Y * STEP_Y) / Math.sqrt(2) * 0.5;
var LENGTH_SCALING = 0.9;

var dragged = false;
var old_X = 0;
var old_Y = 0;
var now_X = 0;
var now_Y = 0;

var off_X = 0;
var off_Y = 0;

var SCALE = 1;

var FIELD;

var y_equation;
var x_equation;

var SHOW_VECTORS = true;
var SHOW_PARTICLES = true;

var COLOR_BY_VELOCITY = false;

var COLOR_VEL_WEIGHT = 1;

var t = 0;

var NUM_PARTICLES = 9999;
var particles = [];

var PARTICLE_DEATH_CHANCE = 0.01;

var ACCEL_MODE = false;

var old_X_generate = 0;
var old_Y_generate = 0;
var new_X_generate = 0;
var new_Y_generate = 0;

var tracing = false;
var tracing_particles = [];

var FULL_CLEAR = false;

var DT_MULT = 0.01;

function updateValues() {
    SHOW_VECTORS = document.getElementById("vect-draw").checked;
    SHOW_PARTICLES = document.getElementById("part-draw").checked;
    COLOR_BY_VELOCITY = document.getElementById("speed-col").checked;
    ACCEL_MODE = document.getElementById("part-accel").checked;
    STEP_X = parseFloat(document.getElementById("Step").value);
    STEP_Y = STEP_X;
    MAX_LENGTH = Math.sqrt(STEP_X * STEP_X + STEP_Y * STEP_Y) / Math.sqrt(2) * 0.5;
    LENGTH_SCALING = 0.9;
    NUM_PARTICLES = parseInt(document.getElementById("num-part").value);
    DT_MULT = parseFloat(document.getElementById("dt-sel").value);
}

function updateEquation() {
    document.getElementById("vx-disp").innerHTML = "p.vx = " + x_equation.toString();
    document.getElementById("vy-disp").innerHTML = "p.vy = " + y_equation.toString();
}

function randomize() {
    x_equation = generateRandomEquation(4);
    y_equation = generateRandomEquation(4);
    updateEquation();
    t = 0;
}


function MOUSE_DOWN(e) {
    if (!dragged && e.buttons & 0x1 == 1) {
        old_X = e.clientX;
        old_Y = e.clientY;
        now_X = e.clientX;
        now_Y = e.clientY;
        dragged = true;
    }
    console.log(e.buttons);
    if ((e.buttons & 2) == 2) {
        console.log("EE");
        old_X_generate = e.clientX;
        old_Y_generate = e.clientY;
        new_X_generate = e.clientX;
        new_Y_generate = e.clientY;
        tracing = true;
    }
}

function MOUSE_MOVE(e) {
    if (dragged) {
        now_X = e.clientX;
        now_Y = e.clientY;
        FULL_CLEAR = true;
    }
    if (tracing) {
        console.log("ye");
        new_X_generate = e.clientX;
        new_Y_generate = e.clientY;
    }
}

function MOUSE_UP(e) {
    if (tracing) {
        console.log("kjfdas")
        var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
        var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
        var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
        var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
        var oldX = old_X_generate * (transformed_maxX - transformed_minX) / WIDTH + transformed_minX;
        var newX = new_X_generate * (transformed_maxX - transformed_minX) / WIDTH + transformed_minX;
        if (oldX > newX) {
            var t = oldX;
            oldX = newX;
            newX = t;
        }
        var oldY = (HEIGHT - old_Y_generate) * (transformed_maxY - transformed_minY) / HEIGHT + transformed_minY;
        var newY = (HEIGHT - new_Y_generate) * (transformed_maxY - transformed_minY) / HEIGHT + transformed_minY;
        if (oldY > newY) {
            var t = oldY;
            oldY = newY;
            newY = t;
        }
        tracing_particles = [];
        console.log(oldX + " " + newX + "   :   " + old_X_generate + " " + new_X_generate);
        console.log(oldY + " " + newY + "   :   " + old_Y_generate + " " + new_Y_generate);
        for (var x = oldX; x < newX; x += (newX-oldX)/ 50) {
            for (var y = oldY; y < newY; y += (newY-oldY)/ 50) {
                tracing_particles.push(new Particle(x, y));
            }
        }
    }
    dragged = false;
    off_X += now_X - old_X;
    off_Y += now_Y - old_Y;
    old_X = 0;
    old_Y = 0;
    now_X = 0;
    now_Y = 0;
    old_X_generate = 0;
    old_Y_generate = 0;
    new_X_generate = 0;
    new_Y_generate = 0;
    tracing = false;
}

function RECALCULATE_CANVAS_SIZE(e) {
    WIDTH = document.documentElement.clientWidth;
    HEIGHT = document.documentElement.clientHeight;

    document.getElementById("vector-field-displayer-vectors").width = WIDTH;
    document.getElementById("vector-field-displayer-vectors").height = HEIGHT;
    document.getElementById("vector-field-displayer-particles").width = WIDTH;
    document.getElementById("vector-field-displayer-particles").height = HEIGHT;
    document.getElementById("vector-field-displayer-overlay").width = WIDTH;
    document.getElementById("vector-field-displayer-overlay").height = HEIGHT;
}

function main() {
    var e = document.getElementById("vector-field-displayer-vectors");
    var e2 = document.getElementById("vector-field-displayer-particles");
    var e3 = document.getElementById("vector-field-displayer-overlay");

    // Attaching event Listeners
    e3.addEventListener("wheel", function (e) {
        SCALE += e.deltaY * 0.01;
    });
    document.getElementById("vect-draw").addEventListener("change", updateValues);
    document.getElementById("part-draw").addEventListener("change", updateValues);
    document.getElementById("speed-col").addEventListener("change", updateValues);
    document.getElementById("uniform-col").addEventListener("change", updateValues);
    document.getElementById("part-accel").addEventListener("change", updateValues);
    document.getElementById("Step").addEventListener("change", updateValues);
    document.getElementById("num-part").addEventListener("change", function () {
        updateValues();
        particles = [];
    });
    document.getElementById("dt-sel").addEventListener("change", updateValues);
    window.addEventListener("resize", RECALCULATE_CANVAS_SIZE);

    // Attach Mouse Listeners
    e3.addEventListener("mousedown", MOUSE_DOWN);
    e3.addEventListener("mousemove", MOUSE_MOVE);
    e3.addEventListener("mouseup", MOUSE_UP);

    // Prevent Scrolling
    document.addEventListener('contextmenu', event => event.preventDefault());

    x_equation = generateRandomEquation(2);
    y_equation = generateRandomEquation(2);
    RECALCULATE_CANVAS_SIZE();
    updateEquation();
    updateValues();

    vectors_canvas = e.getContext("2d");
    particles_canvas = e2.getContext("2d");
    overlay_canvas = e3.getContext("2d");

    var then = 0;

    function update(time) {
        const dt = (time - then) * DT_MULT;
        if (FULL_CLEAR) {
            clear(particles_canvas, 1);
            FULL_CLEAR = false;
        } else {
            clear(particles_canvas, 0.1);
        }
        if (SHOW_PARTICLES) {
            drawParticles(particles_canvas, dt);
        }
        if (SHOW_VECTORS) {
            drawVectorField(vectors_canvas, dt);
        }
        overlay_canvas.clearRect(0, 0, WIDTH, HEIGHT);

        if (tracing) {
            overlay_canvas.strokeStyle = "rgb(10,10,100)";
            overlay_canvas.strokeRect(old_X_generate, old_Y_generate, new_X_generate - old_X_generate, new_Y_generate - old_Y_generate);
            overlay_canvas.stroke();
        }

        then = time;
        t += dt;

        requestAnimationFrame(update);

    }
    requestAnimationFrame(update);
}

function clear(canvas, alpha) {
    canvas.beginPath();
    canvas.fillStyle = "rgb(73, 189, 191)";
    canvas.globalAlpha = alpha;
    canvas.fillRect(0, 0, WIDTH, HEIGHT);
    canvas.fill();
    canvas.globalAlpha = 1.0;
}

function drawVectorField(canvas, dt) {
    canvas.clearRect(0, 0, WIDTH, HEIGHT);
    canvas.fillStyle = "rgb(150,150,255)";
    var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
    var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
    var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
    var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
    for (var i = transformed_minX - transformed_minX % STEP_X; i < transformed_maxX; i += STEP_X) {
        for (var j = transformed_minY - transformed_minY % STEP_Y; j < transformed_maxY; j += STEP_Y) {

            const x = i;
            const y = j;

            canvas.beginPath();
            const d = VectorField(new Particle(x, y));
            canvas.moveTo(map_X(transformed_minX, transformed_maxX, i), map_Y(transformed_minY, transformed_maxY, j));
            const l = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            const rel_l = lengthInterpolator(l);
            canvas.lineTo(map_X(transformed_minX, transformed_maxX, i + d.vx * rel_l), map_Y(transformed_minY, transformed_maxY, j + d.vy * rel_l));
            const col = colorIntepolator(l);
            canvas.strokeStyle = `rgb(${col.r},${col.g},${col.b})`;
            canvas.stroke();
            canvas.fillRect(map_X(transformed_minX, transformed_maxX, i) - 1, map_Y(transformed_minY, transformed_maxY, j) - 1, 3, 3);
            canvas.fill();
        }
    }
}

function drawParticles(canvas, dt) {
    var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
    var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
    var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
    var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
    canvas.fillStyle = "rgb(255,255,255)";
    for (var i = 0; i < particles.length; i++) {
        const x = map_X(transformed_minX, transformed_maxX, particles[i].x)
        const y = map_Y(transformed_minY, transformed_maxY, particles[i].y);
        canvas.fillRect(x, y, 1, 1);
        if (ACCEL_MODE)
            VectorFieldA(particles[i]);
        else
            VectorField(particles[i]);
        particles[i].update(dt);
        const l = Math.sqrt(particles[i].vx * particles[i].vx + particles[i].vy * particles[i].vy);
        if (COLOR_BY_VELOCITY) {
            const col = colorIntepolator(l);
            canvas.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
        }
        canvas.fill();
        if (particles[i].life < 0 || (x < 0 || x > WIDTH) || (y < 0 || y > HEIGHT) || l > WIDTH * HEIGHT || Math.random() < PARTICLE_DEATH_CHANCE) {
            particles[i] = generateParticle();
        }
    }
    for (var i = 0; i < 99; i++) {
        if (particles.length < NUM_PARTICLES) {
            particles.push(generateParticle());
        }
    }
    canvas.fillStyle = "rgb(10,10,100)";
    for (var i = 0; i < tracing_particles.length; i++) {
        const x = map_X(transformed_minX, transformed_maxX, tracing_particles[i].x)
        const y = map_Y(transformed_minY, transformed_maxY, tracing_particles[i].y);
        canvas.fillRect(x, y, 1, 1);
        if (ACCEL_MODE)
            VectorFieldA(tracing_particles[i]);
        else
            VectorField(tracing_particles[i]);
        tracing_particles[i].update(dt);
        canvas.fill();
    }

}

function colorIntepolator(t) {
    const a = t * COLOR_VEL_WEIGHT;
    return {
        r: 1 * a,
        g: (255 - a),
        b: 0
    };
}

function lengthInterpolator(l) {
    if (l < MAX_LENGTH) {
        return LENGTH_SCALING;
    }
    return MAX_LENGTH / l * LENGTH_SCALING;
}

class Particle {
    constructor(x, y, life) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.life = life;
        this.ax = 0;
        this.ay = 0;
    }
    update(dt) {
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
    setForce(x, y) {
        this.vx = x;
        this.vy = y;
    }
}

function scaleFunction(scale) {
    if (scale < 0) {
        return Math.exp(scale + Math.log(0.9)) + 0.1;
    }
    return Math.sqrt(scale + 1);
}

function generateParticle() {
    var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
    var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
    var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
    var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
    return new Particle((transformed_maxX - transformed_minX) * Math.random() + transformed_minX, (transformed_maxY - transformed_minY) * Math.random() + transformed_minY, 10);
}

function VectorField(p) {
    const params = [p.x, p.y, t];
    p.vx = x_equation.evaluate(params);
    p.vy = y_equation.evaluate(params);
    return p;
}

function VectorFieldA(p) {
    const params = [p.x, p.y, t];
    p.ax = x_equation.evaluate(params);
    p.ay = y_equation.evaluate(params);
    return p;
}

function map_X(min, max, old_X) {
    return WIDTH * (old_X - min) / (max - min);
}

function map_Y(min, max, old_Y) {
    return HEIGHT - HEIGHT * (old_Y - min) / (max - min);
}

function generateRandomEquation(times) {
    var function_choice = Math.floor(18 * Math.random());
    if (times) {
        if (times <= 1) {
            function_choice = Math.floor(4 * Math.random());
        }
        switch (function_choice) {
            case 0:
                var e = {};
                e.a = Math.round((Math.random() * 20 - 10) * 10) / 10;
                e.evaluate = function (param_list) {
                    return e.a;
                }
                e.toString = function () {
                    return `${e.a}`;
                }
                return e;
            case 1:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[0];
                }
                e.toString = function () {
                    return "p.x";
                }
                return e;
            case 2:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[1];
                }
                e.toString = function () {
                    return "p.y";
                }
                return e;
            case 3:
                var e = {};
                e.evaluate = function (param_list) {
                    return Math.sqrt(param_list[0] * param_list[0] + param_list[1] * param_list[1]);
                }
                e.toString = function () {
                    return `length(p)`;
                }
                return e;
            case 4:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.sin(e.a.evaluate(param_list));
                }
                e.toString = function () {
                    return `sin(${e.a.toString()})`;
                }
                return e;
            case 5:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.cos(e.a.evaluate(param_list));
                }
                e.toString = function () {
                    return `cos(${e.a.toString()})`;
                }
                return e;
            case 6:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) + e.b.evaluate(param_list);
                }
                e.toString = function () {
                    return `${e.a.toString()}+${e.b.toString()}`;
                }
                return e;
                break;
            case 7:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) - e.b.evaluate(param_list);
                }
                e.toString = function () {
                    return `${e.a.toString()}-${e.b.toString()}`;
                }
                return e;
                break;
            case 8:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) * e.b.evaluate(param_list);
                }
                e.toString = function () {
                    return `${e.a.toString()}*${e.b.toString()}`;
                }
                return e;
                break;
            case 9:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) / e.b.evaluate(param_list);
                }
                e.toString = function () {
                    return `${e.a.toString()}/${e.b.toString()}`;
                }
                return e;
                break;
            case 10:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.abs(e.a.evaluate(param_list));
                }
                e.toString = function () {
                    return `|${e.a.toString()}|`;
                }
                return e;
            case 11:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.min(e.a.evaluate(param_list), e.b.evaluate(param_list));
                }
                e.toString = function () {
                    return `min(${e.a.toString()}, ${e.b.toString()})`;
                }
                return e;
            case 12:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.min(e.a.evaluate(param_list), e.b.evaluate(param_list));
                }
                e.toString = function () {
                    return `min(${e.a.toString()}, ${e.b.toString()})`;
                }
                return e;
            case 13:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.max(e.a.evaluate(param_list), e.b.evaluate(param_list));
                }
                e.toString = function () {
                    return `max(${e.a.toString()}, ${e.b.toString()})`;
                }
                return e;
            case 14:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.exp(e.a.evaluate(param_list));
                }
                e.toString = function () {
                    return `e<sup>${e.a.toString()}</sup>`;
                }
                return e;
            case 15:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.log(Math.abs(e.a.evaluate(param_list)));
                }
                e.toString = function () {
                    return `ln(|${e.a.toString()}|)`;
                }
                return e;
            case 16:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[2];
                }
                e.toString = function () {
                    return `t`;
                }
                return e;
            case 17:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.pow(e.a.evaluate(param_list), e.b.evaluate(param_list));
                }
                e.toString = function () {
                    return `${e.a.toString()}<sup>${e.b.toString()}</sup>`;
                }
                return e;
        }
    }
}