//This constant gives space for the border to show, it is not big enough
//it may hide part of the block
const MARGIN = 80;

//This defines the roughness of the border
const MIN_PATH_DIST = 150;

//This defines how random some part of the border can be
const RANDOM_DIST_FACT = .08;

//This defines the speed of the animation
const ANIMATION_TIME = 2000;

//This defines the possibility of a point on the curve to have a new
//random position
const RANDOM_POSIBILITY = 0.1;

//The time that some points are randomized and each animation starts
const INTERVAL = 200;

//How big the cursor is
const CURSOR_SIZE = 50;

//Color of background
const COLOR = "#ffe600";

//the cursor will change color at this distance within the object
const CHANGE_COLOR_AT = 40;

//the maximum distance from the object that cursor has an effect on
const MAX_EFFECT_DISTANCE = 60;

//It queries all DOM elements that belong in the class "animated" and
//add the animated background and start is animation
function initAnimatedElements(){
    const animatedElements = [];
    const elements = document.getElementsByClassName("animated");
    for (const element of elements)
        animatedElements.push(new AnimatedElement(element));
    animatedElements.forEach(el => el.startAnimation());
    return animatedElements;
}

//It initializes the svg renderer for a given element
function initSnap(element, width, height, isCursor){
    const paper = Snap();
    paper.appendTo(element);
    paper.node.classList.add("svg-background");
    paper.node.style.position = "absolute";
    if (isCursor){
        paper.node.style.top = "-"+(2*MARGIN+height)+"px";
        paper.node.style.left = "-"+(2*MARGIN+width)+"px";
    }else{
        paper.node.style.top = "-"+MARGIN+"px";
        paper.node.style.left = "-"+MARGIN+"px";
    }
    paper.node.style.width = (width+2*MARGIN)+"px";
    paper.node.style.height = (height+2*MARGIN)+"px";
    paper.node.style.zIndex = "-1";
    return paper;
}

//It initializes part of the base geometry of the curves. That is the
//edge points of each curve
function initCurveEnds(width, height){
    const curveEnds = [];
    const topBottomPoints = Math.max(Math.floor(width/MIN_PATH_DIST), 1);
    const leftRightPoints = Math.max(Math.floor(height/MIN_PATH_DIST), 1);
    for (var i = 0; i < topBottomPoints; i++)
        curveEnds.push([
            MARGIN+(i+1/2)*width/topBottomPoints,
            MARGIN,
            width/topBottomPoints,
        ]);
    for (var i = 0; i < leftRightPoints; i++)
        curveEnds.push([
            MARGIN+width,
            MARGIN+(i+1/2)*height/leftRightPoints,
            height/leftRightPoints,
        ]);
    for (var i = 0; i < topBottomPoints; i++)
        curveEnds.push([
            MARGIN+(topBottomPoints-(i+1/2))*width/topBottomPoints,
            MARGIN+height,
            width/topBottomPoints,
        ]);
    for (var i = 0; i < leftRightPoints; i++)
        curveEnds.push([
            MARGIN,
            MARGIN+(leftRightPoints-(i+1/2))*height/leftRightPoints,
            height/leftRightPoints,
        ]);
    return curveEnds.map(
        el => [Math.floor(el[0]), Math.floor(el[1]), Math.floor(el[2])]
    );
}

//It initializes part of the base geometry of the curves. That is the
//control points of each curve
function initCurveControlPoints(width, height){
    const curveControlPoints = [];
    const topBottomPoints = Math.max(Math.floor(width/MIN_PATH_DIST), 1);
    const leftRightPoints = Math.max(Math.floor(height/MIN_PATH_DIST), 1);
    for (var i = 1; i < topBottomPoints; i++)
        curveControlPoints.push([
            MARGIN+(i-1/2+2/3)*width/topBottomPoints,
            MARGIN,
            width/topBottomPoints,
        ]);
    for (var i = 0; i < leftRightPoints; i++)
        curveControlPoints.push([
            MARGIN+width,
            MARGIN+(i-1/2+2/3)*height/leftRightPoints,
            height/leftRightPoints,
        ]);
    for (var i = 0; i < topBottomPoints; i++)
        curveControlPoints.push([
            MARGIN+(topBottomPoints-(i-1/2+2/3))*width/topBottomPoints,
            MARGIN+height,
            width/topBottomPoints,
        ]);
    for (var i = 0; i < leftRightPoints; i++)
        curveControlPoints.push([
            MARGIN,
            MARGIN+(leftRightPoints-(i-1/2+2/3))*height/leftRightPoints,
            height/leftRightPoints
        ]);
    curveControlPoints.push([
        MARGIN+(-1/2+2/3)*width/topBottomPoints,
        MARGIN,
        width/topBottomPoints
    ]);
    return curveControlPoints.map(
        el => [Math.floor(el[0]), Math.floor(el[1]), Math.floor(el[2])]
    );
}

//It initializes the DOM element that is screen wide and the cursor
//moves within
function initCursorScreen(){
    const screenElement = document.createElement("div");
    screenElement.id = "cursor-screen";
    screenElement.style.position = "fixed";
    screenElement.style.left = "0";
    screenElement.style.top = "0";
    screenElement.style.width = "100%";
    screenElement.style.height = "100%";
    screenElement.style.overflow = "hidden";
    screenElement.style.zIndex = "1";
    screenElement.style.pointerEvents = "none";
    document.body.appendChild(screenElement);
    return screenElement;
}

//It randomly moves some of the control points of some curves
function setRandomPoints(){
    for (var i = 0; i < this.curves; i++)
        if (Math.random() < RANDOM_POSIBILITY){
            var r1 = 2*Math.random()*Math.PI;
            var r2 = Math.random()*this.curveEnds[i][2]*RANDOM_DIST_FACT;
            this.randomEnds[i] = [
                Math.floor(this.curveEnds[i][0]+Math.sin(r1)*r2),
                Math.floor(this.curveEnds[i][1]+Math.cos(r1)*r2)
            ];
            r1 = 2*Math.random()*Math.PI;
            r2 = Math.random()*this.curveControlPoints[i][2]*RANDOM_DIST_FACT;
            this.randomControlPoints[i] = [
                Math.floor(this.curveControlPoints[i][0]+Math.sin(r1)*r2),
                Math.floor(this.curveControlPoints[i][1]+Math.cos(r1)*r2)
            ];
        }
}

//It returns the SVG path string of the border. It sets it up from the
//control points.
function getBorderPathString(){
    const firstControlPoint = [
       2*this.randomEnds[0][0]-this.randomControlPoints[this.curves-1][0],
       2*this.randomEnds[0][1]-this.randomControlPoints[this.curves-1][1],
    ];
    var pathString = "M"+this.randomEnds[0][0]+","
        +this.randomEnds[0][1]+" "
        +"C"+firstControlPoint[0]+","
        +firstControlPoint[1]+" "
        +this.randomControlPoints[0][0]+","
        +this.randomControlPoints[0][1]+" "
        +this.randomEnds[1][0]+","
        +this.randomEnds[1][1]+" ";
    for (var i = 1; i < this.curves; i++){
        pathString = pathString+"S"
        +this.randomControlPoints[i][0]+","
        +this.randomControlPoints[i][1]+" "
        +this.randomEnds[(i+1)%this.curves][0]+","
        +this.randomEnds[(i+1)%this.curves][1]+" ";
    }
    return pathString;
}

mySetInterval = function (vCallback, nDelay) {
    var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
    return window.setInterval(vCallback instanceof Function ? function () {
        vCallback.apply(oThis, aArgs);
    } : vCallback, nDelay);
};

//It sets and starts the animation of each background
function startAnimation(){
    const borderPath = this.borderPath;
    const borderPathString = this.getBorderPathString();
    const setRandomPoints = this.setRandomPoints;
    mySetInterval.call(
        this,
        function (){
            this.setRandomPoints();
            const borderPathString = this.getBorderPathString();
            this.borderPath.animate(
                {d: borderPathString},
                ANIMATION_TIME,
                mina.linear
            );
        },
        INTERVAL
    );
}

//Utility function that helps compute path length for closed paths
function incrementLength(totalLength, current, increment){
    const t = Math.floor(totalLength);
    const i = Math.floor(current+increment+totalLength);
    return i%t;
}

//It stops any color related animation that is happening on an SVG
//element
function stopCursorColorAnim(){
    animatedCursor.borderPath.inAnim().filter(e => e.anim.attr["fill"]).forEach(e => e.stop());
}

//It enables the background of an element to interact with the cursor
function interact(e, owner, currentId){
    const rect = owner.snap.node.getBoundingClientRect();
    const x = e.pageX-rect.left-document.documentElement.scrollLeft;
    const y = e.pageY-rect.top-document.documentElement.scrollTop;
    const cp1 = Snap.closestPoint(owner.borderPath, owner.curves, x, y);
    if (cp1.distance > MAX_EFFECT_DISTANCE){
        if (owner.mouseHoverPath){
            owner.mouseHoverPath.remove();
            owner.mouseHoverPath = null;
        }
        drawId++;
    }else{
        const tl1 = owner.borderPath.getTotalLength();
        const expand1 = Math.min(
            Math.max(150-2*cp1.distance, 30),
            100,
            owner.width,
            owner.height
        );

        const ll = owner.borderPath.getPointAtLength(
            incrementLength(tl1, cp1.length, -expand1)
        );
        var rads = Snap.rad(ll.alpha);
        const llc = [ll.x-30*Math.cos(rads), ll.y-30*Math.sin(rads)];
        const rr = owner.borderPath.getPointAtLength(
            incrementLength(tl1, cp1.length, expand1)
        );
        rads = Snap.rad(rr.alpha);
        const rrc = [rr.x+30*Math.cos(rads), rr.y+30*Math.sin(rads)];

        const dist = Snap.len(ll.x, ll.y, rr.x, rr.y);
        const vec = [(-ll.y+rr.y)/dist, (ll.x-rr.x)/dist];
        const x1 = (cp1.distance+CURSOR_SIZE/2)*vec[0];
        const y1 = (cp1.distance+CURSOR_SIZE/2)*vec[1];
        const cp2 = Snap.closestPoint(
            animatedCursor.borderPath,
            animatedCursor.curves,
            x1+CURSOR_SIZE/2+MARGIN,
            y1+CURSOR_SIZE/2+MARGIN
        );
        const expand2 = Math.min(Math.max(cp1.distance, 0), 100);
        const tl2 = animatedCursor.borderPath.getTotalLength();
        const lrCursor = animatedCursor.borderPath.getPointAtLength(
            incrementLength(tl2, cp2.length, -expand2)
        );
        const rlCursor = animatedCursor.borderPath.getPointAtLength(
            incrementLength(tl2, cp2.length, expand2)
        );

        const lr = [
            lrCursor.x+x-CURSOR_SIZE/2-MARGIN,
            lrCursor.y+y-CURSOR_SIZE/2-MARGIN,
        ];
        rads = Snap.rad(lrCursor.alpha);
        const lrc = [lr[0]+30*Math.cos(rads), lr[1]+30*Math.sin(rads)];
        const rl = [
            rlCursor.x+x-CURSOR_SIZE/2-MARGIN,
            rlCursor.y+y-CURSOR_SIZE/2-MARGIN,
        ];
        rads = Snap.rad(rlCursor.alpha);
        const rlc = [rl[0]-30*Math.cos(rads), rl[1]-30*Math.sin(rads)];

        const expand3 = Math.min(
            owner.width/2,
            owner.height/2,
        )
        rads = Snap.rad(ll.alpha);
        const start = [
            ll.x+expand3*Math.sin(rads),
            ll.y-expand3*Math.cos(rads)
        ];
        rads = Snap.rad(rr.alpha);
        const end = [
            rr.x+expand3*Math.sin(rads),
            rr.y-expand3*Math.cos(rads)
        ];

        var pathString = "M"+start[0]+","+start[1]+" "
            +"L"+ll.x+","+ll.y+" "
            +"C"
            +llc[0]+","+llc[1]+" "
            +lrc[0]+","+lrc[1]+" "
            +lr[0]+","+lr[1]+" "
            +"L"+rl[0]+","+rl[1]+" "
            +"C"
            +rlc[0]+","+rlc[1]+" "
            +rrc[0]+","+rrc[1]+" "
            +rr.x+","+rr.y+" "
            +"L"+end[0]+","+end[1];

        if (owner.mouseHoverPath){
            owner.mouseHoverPath.attr({d: pathString});
        }else{
            owner.mouseHoverPath = owner.snap.path(pathString);
            owner.mouseHoverPath.attr({
                fill: COLOR,
                stroke: "none"
            });
        }
    }
    if (cp1.distance > CHANGE_COLOR_AT){
        if (
            x > MARGIN
            && x < MARGIN+owner.width
            && y > MARGIN
            && y < MARGIN+owner.height
        ){
            if (animatedCursor.colored){
                stopCursorColorAnim();
                animatedCursor.borderPath.animate({fill: "#fff"}, 200);
                animatedCursor.colored = false;
            }
        }
    }else{
        if (!animatedCursor.colored){
            stopCursorColorAnim();
            animatedCursor.borderPath.animate({fill: COLOR}, 200);
            animatedCursor.colored = true;
        }
    }
    if (drawId == currentId)
        window.requestAnimationFrame(function(){interact(e, owner, currentId)});
    else if (owner.mouseHoverPath){
        owner.mouseHoverPath.remove();
        owner.mouseHoverPath = null;
    }
}

//It enables the animated cursor to move on the screen
function enableMoving(){
    const screenElement = animatedCursor.screenElement;
    const cursorSVG = animatedCursor.snap.node;
    document.documentElement.onmousemove = function(e) {
        animatedCursor.x = e.pageX-document.documentElement.scrollLeft;
        const x = animatedCursor.x-screenElement.getBoundingClientRect().left;
        animatedCursor.y = e.pageY-document.documentElement.scrollTop;
        const y = animatedCursor.y-screenElement.getBoundingClientRect().top;
        cursorSVG.style.left = (x-CURSOR_SIZE/2-MARGIN)+"px";
        cursorSVG.style.top = (y-CURSOR_SIZE/2-MARGIN)+"px";
    }
}

//It finds the closest point to a path.
//This function is a dublicate from snap.svg.js because the original
//uses deprecated code
Snap.closestPoint = function (path, segs, x, y) {
    function distance2(p) {
        var dx = p.x - x,
            dy = p.y - y;
        return dx * dx + dy * dy;
    }
    var pathNode = path.node,
        pathLength = pathNode.getTotalLength(),
        precision = pathLength / segs * .5,
        best,
        bestLength,
        bestDistance = Infinity;

    // linear scan for coarse approximation
    cnt = 0;
    for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
        if ((scanDistance = distance2(scan = pathNode.getPointAtLength(Math.min(scanLength, pathLength-1)))) < bestDistance) {
            best = scan;
            bestLength = scanLength;
            bestDistance = scanDistance;
        }
        cnt++;
    }

    // binary search for precise estimate
    precision *= .5;
    while (precision > .5) {
        var before,
            after,
            beforeLength,
            afterLength,
            beforeDistance,
            afterDistance;
        if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
            best = before;
            bestLength = beforeLength;
            bestDistance = beforeDistance;
        } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after;
            bestLength = afterLength;
            bestDistance = afterDistance;
        } else {
            precision *= .5;
        }
        cnt++;
    }

    best = {
        x: best.x,
        y: best.y,
        length: bestLength,
        distance: Math.sqrt(bestDistance)
    };
    return best;
}

//Constructor of an object that has animated background
function AnimatedElement(element){
    const width = element.clientWidth;
    const height = element.clientHeight;
    this.width = width;
    this.height = height;
    this.element = element;
    this.snap = initSnap(element, width, height, false);
    this.curveEnds = initCurveEnds(width, height);
    this.randomEnds = this.curveEnds.slice();
    this.curves = this.curveEnds.length;
    this.curveControlPoints = initCurveControlPoints(width, height);
    this.randomControlPoints = this.curveControlPoints.slice();
    this.setRandomPoints = setRandomPoints;
    this.setRandomPoints();
    this.getBorderPathString = getBorderPathString;
    this.borderPath = this.snap.path(this.getBorderPathString());
    this.borderPath.attr({
        fill: COLOR,
        stroke: "none"
    });
    this.mouseHoverPath = null;
    this.startAnimation = startAnimation;
    this.element.onmousemove = e => {
        drawId++;
        owner = this;
        window.requestAnimationFrame(function(){interact(e, owner, drawId)});
    };
    this.element.onmouseleave = e => {
        drawId++;
        if (!animatedCursor.colored){
            stopCursorColorAnim();
            animatedCursor.borderPath.attr({fill: COLOR});
            animatedCursor.colored = true;
        }
    };
}

//Constructor of an object that helps add animated background to the
//cursor
function AnimatedCursor(){
    this.screenElement = initCursorScreen();
    this.snap = initSnap(this.screenElement, CURSOR_SIZE, CURSOR_SIZE, true);
    this.curveEnds = initCurveEnds(CURSOR_SIZE, CURSOR_SIZE);
    this.randomEnds = this.curveEnds.slice();
    this.curves = this.curveEnds.length;
    this.curveControlPoints =
        initCurveControlPoints(CURSOR_SIZE, CURSOR_SIZE);
    this.randomControlPoints = this.curveControlPoints.slice();
    this.setRandomPoints = setRandomPoints;
    this.setRandomPoints();
    this.getBorderPathString = getBorderPathString;
    this.borderPath = this.snap.path(this.getBorderPathString());
    this.borderPath.attr({
        fill: COLOR,
        stroke: "none"
    });
    this.colored = true;
    this.startAnimation = startAnimation;
    this.enableMoving = enableMoving;
}

var drawId = 0;
const animatedCursor = new AnimatedCursor();

function main(){
    const animatedElements = initAnimatedElements();
    animatedCursor.startAnimation();
    animatedCursor.enableMoving();
}

main();
