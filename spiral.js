/////////////////////////////////////////////////////////////
//////////////////////    Vec3     //////////////////////////
/////////////////////////////////////////////////////////////

var Vec3 = function( x, y, z ) {
  this.x = x;
  this.y = y;
  this.z = z;
};


/////////////////////////////////////////////////////////////
////////////////////   SpiralMenu     ///////////////////////
/////////////////////////////////////////////////////////////

var SpiralMenu = function( canvas, content ) {
  this.canvas = canvas;
  this.content = content;
  this.container = canvas.parentElement;

  // visual elements
  var self = this;
  var configuration = new SpiralConfig( canvas, 50 );
  var numSpirals = content.length;
  var spirals = [];
    
  // Spiral drag properties
  var isMouseDown = false;
  var pMouseX = 0;
  var mouseX = 0;
  var gravity = 1;
  var spiralRotation = 0;
  var spiralSpeed = 0.012;
  var frameReq = 0;

  // labels
  var labelPool = [];
  var labels = [];

  for ( var i = 0; i < numSpirals; ++i ) {
    spirals.push( new Spiral( i * Math.PI, Math.PI * 0.8 ) );
    var sl = [];
    var nn = content[i].content.length;
    for ( var j = 0; j < nn; ++j ) {
      var label = new SpiralLabel( content[i].content[j], this.container, configuration );
      sl.push( label );
    }
    labels.push( sl );
  }

  window.addEventListener( 'resize',    onSpiralResize );
  this.canvas.addEventListener( 'mousedown', onSpiralDragMouseDown );
  this.canvas.addEventListener( 'mouseup',   onSpiralDragMouseUp );
  this.container.addEventListener( 'mousedown', onContainerMouseDown );

  render();

  function onSpiralResize( event ) {
    configuration.center();
  }

  function onContainerMouseDown( event )  {
    if ( event.target.classList.contains( 'node' ) ) {
      console.log(event.target.innerHTML);
    }
  }

  function onSpiralDragMouseDown( event ) {
    isMouseDown = true; 
    self.canvas.style.cursor = 'ew-resize';
    gravity = 0.9;
    pMouseX = event.pageX; 
    mouseX = pMouseX;
    self.canvas.addEventListener( 'mousemove', onSpiralDragMouseMove );
    if ( frameReq == 0 ) {
      frameReq = requestAnimationFrame( render );
    }
  }

  function onSpiralDragMouseMove( event ) {
    mouseX = event.pageX;
  }

  function onSpiralDragMouseUp( event ) {
    isMouseDown = false; 
    self.canvas.style.cursor = 'pointer';
    self.canvas.removeEventListener( 'mousemove', onSpiralDragMouseMove );
  }

  function render() {
    // console.log("render");
    // clear canvas
    this.canvas.width = configuration.canvasWidth;
    this.canvas.height = configuration.canvasHeight;

    // handle spiral rotation
    if ( isMouseDown ) {
      var diff = ( mouseX - pMouseX ) * 0.01;
      spiralRotation += diff;
      spiralSpeed = diff*2;
      pMouseX = mouseX;
    } else {
      spiralSpeed *= gravity;
      spiralRotation += spiralSpeed;
    }

    // render spirals
    for ( var i = 0; i < numSpirals; ++i ) {
      var nl = labels[i].length;
      var points = spirals[i].rotate(spiralRotation, configuration, nl );

      for ( var j = 0; j < nl; ++j ) {
        labels[i][j].follow(points[j]);
      }

      // position labels
    }
    
    

    // auto stop frame request when idle
    if ( isMouseDown || Math.abs( spiralSpeed ) > 0.001 ) {
      frameReq = requestAnimationFrame( render );
    } else {
      frameReq = 0;
    }
  }
};



/////////////////////////////////////////////////////////////
////////////////////  SpiralConfig    ///////////////////////
/////////////////////////////////////////////////////////////

var SpiralConfig = function( canvas, numPoints ) {
  // Spiral properties
  this.canvas = canvas;
  this.context = canvas.getContext( '2d' );
  this.canvasWidth = this.canvas.clientWidth;
  this.canvasHeight = this.canvas.clientHeight;
  this.centerX = this.canvasWidth / 2;
  this.centerY = this.canvasHeight / 2;
  this.width = Math.min( this.centerX - 20, 200 );
  this.height = Math.min( this.canvasHeight - 40, 600 );
  this.nPoints = numPoints;

  // Label properties
  this.inertia = 0.4;
  this.k = 0.2;
  this.linkMargin = 5;
  this.scaleLimit = 0.5;
};

SpiralConfig.prototype.center = function() {
  this.canvasWidth = this.canvas.clientWidth;
  this.canvasHeight = this.canvas.clientHeight;
  this.centerX = this.canvasWidth / 2;
  this.centerY = this.canvasHeight / 2;
  this.canvas.width = this.canvasWidth;
  this.canvas.height = this.canvasHeight;
};


/////////////////////////////////////////////////////////////
//////////////////////   Spiral     /////////////////////////
/////////////////////////////////////////////////////////////

var Spiral = function( offset, length ) {
  this.angleOffset = offset;
  this.length = length;
};

Spiral.prototype.rotate = function( rotation, config, numPoints ) {
  var 
    vectors = [],
    p = new Vec3( 0, 0, 0 ),
    pointsDelay = Math.floor( config.nPoints / numPoints ),
    pointsPos = 0,
    pointsNext = Math.floor( pointsDelay / 2 ) + 1,
    yStep = config.height / ( config.nPoints - 1 ),
    angleStep = this.length / ( config.nPoints - 1 ),
    middle = -config.nPoints/2,
    angle = 0,
    z = 0;
  
  rotation += this.angleOffset;
  
  p.z = Math.cos( rotation ) * 0.4 + 0.6;
  p.x = config.centerX + config.width * Math.sin( rotation );
  p.y = config.centerY + middle * yStep;// * p.z;
  config.context.lineCap = 'square';
  config.context.beginPath();
  config.context.moveTo( p.x, p.y );

  for ( var i = 1; i < config.nPoints; ++i ) {
    angle = rotation + i * angleStep;
    z = Math.cos( angle ) * 0.4 + 0.6;
    p = new Vec3(
      config.centerX + config.width * Math.sin( angle ),
      config.centerY + ( i + middle ) * yStep,// * z,
      z
    );
    config.context.lineWidth = z*8+2;
    config.context.strokeStyle = 'rgba(255,255,255,' + z + ')';
    config.context.lineTo( p.x , p.y );
    config.context.stroke();
    config.context.beginPath();
    config.context.moveTo( p.x , p.y );

    if ( i >= pointsNext ) {
      vectors.push( p );
      pointsNext += pointsDelay;
    }
  }
  
  return vectors;
};


/////////////////////////////////////////////////////////////
///////////////////   SpiralLabel     ///////////////////////
/////////////////////////////////////////////////////////////

var SpiralLabel = function( node, container, config ) {
  this.config = config;
  this.node = node;
  this.posX = this.config.centerX >> 1;
  this.posY = this.config.centerY >> 1;
  this.speedX = 0;
  this.speedY = 0;
  this.offsetX = 0;
  this.offsetY = 0;
  this.marginX = 25;
  this.marginY = 0;
  this.isLeft = true;

  var e = document.createElement( 'span' );
  e.className = 'spiral-flying-label';
  e.innerHTML = '<span class="node ' + node.type + '">' + node.title_fr + '</span>';
  e.style.left = this.posX + 'px';
  e.style.top = this.posY + 'px';
  container.appendChild(e);
  this.element = e;
};

SpiralLabel.prototype.setPosition = function( p ) {
  this.posX = p.x;
  this.posY = p.y;
  this.speedX = 0;
  this.speedY = 0;
  this.offsetX = 0;
  this.offsetY = 0;
};

SpiralLabel.prototype.follow = function( p ) {
  // todo: import logic from FlyingLabel class

  if ( p.x < this.config.centerX ) {
    // this.offsetX = -this.marginX;
    this.isLeft = true;
    this.element.classList.add('left');
  } else {
    // this.offsetX = this.marginX;
    this.isLeft = false;
    this.element.classList.remove('left');
  }

  this.speedX *= this.config.inertia;
  this.speedX += (p.x + this.offsetX - this.posX) * this.config.k;
  this.posX += this.speedX;

  this.speedY *= this.config.inertia;
  this.speedY += (p.y + this.offsetY - this.posY) * this.config.k;
  this.posY += this.speedY;

  this.element.style.left = this.posX + 'px';
  this.element.style.top = this.posY + 'px';
  this.element.style.opacity = p.z * 0.8 + 0.2;
};
