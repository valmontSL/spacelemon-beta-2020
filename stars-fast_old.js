if (screen && screen.width > 500) {
canvasApp();
function canvasApp(){
  var theCanvas = document.getElementById('screen-faster-stronger')
    , context = theCanvas.getContext('2d')
    , stars = new Array(1800)
    , starSpeed = 10
    , cWidth = theCanvas.width = window.innerWidth
    , cHeight = theCanvas.height = window.innerHeight
    , halfWidth  = cWidth / 2
    , halfHeight = cHeight / 2
    , depth = 1000
    , colour = ''
    // Convert degrees to radians
    , hfov = 100 * Math.PI / 180
    , vfov = 80 * Math.PI / 180
    // Set up the view distance based on the field-of-view (with pythagoras)
    , hViewDistance = cWidth / Math.tan( hfov / 2 )
    , vViewDistance = cHeight / Math.tan( vfov / 2 );
    starInit();
  function randomRange(x) {
    var   minVal = -x
        , maxVal = x
    return Math.floor(Math.random() * (maxVal - minVal - 1)) + minVal;
  }
  function starInit() {
    for( var i = 0; i < stars.length; i++ ) {
      stars[i] = {
        x : randomRange(cWidth),
        y : randomRange(cHeight),
        z : Math.floor( Math.random() * depth )
      }
    }
    setInterval(moveStars,40);
  }
  function moveStars(){
    /*Reset the canvas*/
    context.fillStyle = "rgb(0,0,0)";
    context.fillRect(0,0,cWidth,cHeight);
    for( var i = 0; i < stars.length; i++ ) {
      stars[i].z -= starSpeed;
      if(stars[i].z <= 10)
      {
        stars[i] = {
          x : randomRange(cWidth),
          y : randomRange(cHeight),
          z : depth
        }
      }
      // Project to 2D space
      stars[i].protectedx = (stars[i].x * hViewDistance) / stars[i].z;
      stars[i].protectedy = (stars[i].y * vViewDistance) / stars[i].z;
      // Transform from screen cordinates to X/Y
      stars[i].protectedx  += halfWidth;
      stars[i].protectedy = halfHeight - stars[i].protectedy;
      //colour
      var shade = Math.floor( ( 1 - (stars[i].z / depth) ) * 255 );
      //Size
      var size =  Math.floor(( 1 - (stars[i].z / depth) ) * 4 );
      context.fillStyle = "rgb("+shade+","+shade+","+shade+")";
      context.beginPath();
      context.arc(stars[i].protectedx,stars[i].protectedy, size, 0, Math.PI*2, true);
      context.closePath();
      context.fill();
    }
  }
}}