var canvas;

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;



var minX = -10;
var maxX = 10;
var minY = -HEIGHT / WIDTH * (maxX - minX) / 2;
var maxY = HEIGHT / WIDTH * (maxX - minX) / 2;

var STEP_X = 1;
var STEP_Y = 1;

var MAX_LENGTH = Math.sqrt(STEP_X * STEP_X + STEP_Y * STEP_Y) / Math.sqrt(2) * 0.99;
var LENGTH_SCALING = MAX_LENGTH / 2;

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

function main() {
    var e = document.getElementById("vector-field-displayer");

    document.addEventListener("wheel", function (e) {
        SCALE += e.deltaY * 0.01;
        return false;
    });

    x_equation = generateRandomEquation(10);
    y_equation = generateRandomEquation(10);

    document.addEventListener("mousedown", function (e) {
        if (!dragged) {
            old_X = e.clientX;
            old_Y = e.clientY;
            dragged = true;
        }
    });

    document.addEventListener("mousemove", function (e) {
        if (dragged) {
            now_X = e.clientX;
            now_Y = e.clientY;
        }
    })

    document.addEventListener("mouseup", function (e) {
        dragged = false;
        off_X += now_X - old_X;
        off_Y += now_Y - old_Y;
        old_X = 0;
        old_Y = 0;
        now_X = 0;
        now_Y = 0;

    })

    e.width = WIDTH;
    e.height = HEIGHT;
    canvas = e.getContext("2d");

    var then = 0;

    function update(time) {
        const dt = (time - then) / 1000;
        canvas.beginPath();
        clear(canvas);
        //drawGrid(canvas);
        drawParticles(canvas, dt);
        drawVectorField(canvas, dt);
        then = time;

        requestAnimationFrame(update);

    }
    requestAnimationFrame(update);
}

function clear(canvas) {
    canvas.fillStyle = "rgb(0,0,0)";
    canvas.globalAlpha = 0.1;
    canvas.fillRect(0, 0, WIDTH, HEIGHT);
    canvas.fill();
    canvas.globalAlpha = 1.0;
}

function drawGrid(ctx) {
    ctx.strokeStyle = "rgb(255,255,255)";
    var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
    var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
    var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
    var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
    var mid_X = (transformed_maxX + transformed_minX) / 2;
    var mid_Y = (transformed_maxY + transformed_minY) / 2;
    ctx.moveTo(0, map_Y(transformed_minY, transformed_maxY, 0));
    ctx.lineTo(WIDTH, map_Y(transformed_minY, transformed_maxY, 0));
    ctx.stroke();
    ctx.moveTo(map_X(transformed_minX, transformed_maxX, 0), 0);
    ctx.lineTo(map_X(transformed_minX, transformed_maxX, 0), HEIGHT);
    ctx.stroke();
}

var t = 0;

function drawVectorField(canvas, dt) {
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
            canvas.lineTo(map_X(transformed_minX, transformed_maxX, i + (d.vx * rel_l)), map_Y(transformed_minY, transformed_maxY, j + (d.vy * rel_l)));
            const col = colorIntepolator(l);
            canvas.strokeStyle = `rgb(${col.r},${col.g},${col.b})`;
            canvas.stroke();
            canvas.fillRect(map_X(transformed_minX, transformed_maxX, i), map_Y(transformed_minY, transformed_maxY, j), 2, 2);
            canvas.fill();
        }
    }
    t += dt;
}
var NUM_PARTICLES = 9999;
var particles = [];

function drawParticles(canvas, dt) {
    var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
    var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
    var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
    var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
    canvas.fillStyle = "rgb(255,255,255)";
    for (var i = 0; i < particles.length; i++) {
        canvas.fillRect(map_X(transformed_minX, transformed_maxX, particles[i].x), map_Y(transformed_minY, transformed_maxY, particles[i].y), 1, 1);
        VectorField(particles[i]);
        particles[i].update(dt);
        canvas.fill();
        if (particles[i].life < 0) {
            particles[i] = generateParticle();
        }
    }
    for (var i = 0; i < 99; i++) {
        if (particles.length < NUM_PARTICLES) {
            particles.push(generateParticle());
        }
    }

}

function colorIntepolator(t) {
    const a = t / MAX_LENGTH;
    return {
        r: 255 * a,
        g: 255 * (1 - a),
        b: 0
    };
}

function lengthInterpolator(l) {
    if (l * LENGTH_SCALING < MAX_LENGTH) {
        return LENGTH_SCALING;
    }
    return MAX_LENGTH / l;
}

class Particle {
    constructor(x, y, life) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.life = life;
    }
    update(dt) {
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
        return Math.exp(scale);
    }
    return Math.sqrt(scale + 1);
}

function generateParticle() {
    var transformed_minX = scaleFunction(SCALE) * minX - (now_X - old_X + off_X) / 30;
    var transformed_minY = scaleFunction(SCALE) * minY + (now_Y - old_Y + off_Y) / 30;
    var transformed_maxX = scaleFunction(SCALE) * maxX - (now_X - old_X + off_X) / 30;
    var transformed_maxY = scaleFunction(SCALE) * maxY + (now_Y - old_Y + off_Y) / 30;
    return new Particle((transformed_maxX - transformed_minX) * Math.random() + transformed_minX, (transformed_maxY - transformed_minY) * Math.random() + transformed_minY, 2 * Math.random());
}

function VectorField(p) {
    const params = [p.x, p.y];
    p.vx = x_equation.evaluate(params);
    p.vy = y_equation.evaluate(params);
    return p;
}

function map_X(min, max, old_X) {
    return WIDTH * (old_X - min) / (max - min);
}

function map_Y(min, max, old_Y) {
    return HEIGHT - HEIGHT * (old_Y - min) / (max - min);
}

function generateRandomEquation(times) {
    var function_choice = Math.floor(9 * Math.random());
    if (times) {
        if(times <= 1){
            function_choice = Math.floor(3 * Math.random());
        }
        switch (function_choice) {
            case 0:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[0];
                }
                return e;
            case 1:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[1];
                }
                return e;
            case 3:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.sin(e.a.evaluate(param_list));
                }
                return e;
                break;
            case 4:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return Math.cos(e.a.evaluate(param_list));
                }
                return e;
                break;
            case 2:
                var e = {};
                e.evaluate = function (param_list) {
                    return Math.sqrt(param_list[0] * param_list[0] + param_list[1] * param_list[1]);
                }
                return e;
                break;
            case 5:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) + e.b.evaluate(param_list);
                }
                return e;
                break;
            case 6:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) - e.b.evaluate(param_list);
                }
                return e;
                break;
            case 7:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) * e.b.evaluate(param_list);
                }
                return e;
                break;
            case 8:
                var e = {};
                e.a = generateRandomEquation(times - 1);
                e.b = generateRandomEquation(times - 1);
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) / e.b.evaluate(param_list);
                }
                return e;
                break;
            case 9:
                break;

        }
    }else{
        switch (function_choice) {
            case 0:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[0];
                }
                return e;
            case 1:
                var e = {};
                e.evaluate = function (param_list) {
                    return param_list[1];
                }
                return e;
            case 2:
                var e = {};
                e.a = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return Math.sin(e.a.evaluate(param_list));
                }
                return e;
                break;
            case 3:
                var e = {};
                e.a = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return Math.cos(e.a.evaluate(param_list));
                }
                return e;
                break;
            case 4:
                var e = {};
                e.a = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return Math.sqrt(param_list[0] * param_list[0] + param_list[1] * param_list[1]);
                }
                return e;
                break;
            case 5:
                var e = {};
                e.a = generateRandomEquation();
                e.b = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) + e.b.evaluate(param_list);
                }
                return e;
                break;
            case 6:
                var e = {};
                e.a = generateRandomEquation();
                e.b = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) - e.b.evaluate(param_list);
                }
                return e;
                break;
            case 7:
                var e = {};
                e.a = generateRandomEquation();
                e.b = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) * e.b.evaluate(param_list);
                }
                return e;
                break;
            case 8:
                var e = {};
                e.a = generateRandomEquation();
                e.b = generateRandomEquation();
                e.evaluate = function (param_list) {
                    return e.a.evaluate(param_list) / e.b.evaluate(param_list);
                }
                return e;
                break;
            case 9:
                break;

        }
    }
}