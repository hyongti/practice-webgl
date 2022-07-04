let gl;
let shaderProgram;
let vertexBuffer;

// WebGLRenderingContext는 웹지엘 API 사용에 필요한 인터페이스
function createGLContext(canvas) {
  let context;

  try {
    context =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch (e) {
    console.log("fail to get context");
  }

  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("fail to create WebGL context");
  }

  return context;
}

function loadShader(type, shaderSource) {
  // shader 객체 생성
  const shader = gl.createShader(type);

  // shader 코드가 shader 객체에 로드
  gl.shaderSource(shader, shaderSource);
  // 컴파일
  gl.compileShader(shader);

  // getShaderParameter()를 통해 컴파일 상태를 체크할 수 있음
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`Error compiling shader ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setupShaders() {
  const vertexShaderSource = `
  attribute vec3 aVertexPosition;
  void main() {
    // 네 번째 인자 1은 3D상의 점을 동차 좌표계의 점으로 치환
    gl_Position = vec4(aVertexPosition, 1.0);
  }
  `;

  const fragmentShaderSource = `
  precision mediump float;
  void main() {
    // RGBA
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  `;

  // GPU에서 렌더링에 필요한 shader를 만들고 업로드하려면 먼저 shader 객체를 만들고 소스 코드를 객체에 로드한 후 컴파일하고
  const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  // 프로그램 객체를 만들고 프로그램 객체에 shader를 링크해야 함
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  // vertexShader의 attribute 변수 위치를 지네릭 attribute 인덱스에 할당
  // webGL에는 고정된 수량의 attribute 슬롯이 있고, 지네릭 attribute 인덱스는 이러한 슬롯을 구분하는데 사용됨.
  // 지네릭 attribute 인덱스를 알고 있어야 그리기 과정에서 버퍼의 버텍스 shader를 버텍스 shader의 attribute와 일치시킬 수 있음.

  // draw함수에서 shaderProgram.vertexPositionAttribute에 저장된 인덱스를
  // 버텍스 데이터를 저장하고 있는 버퍼와 버텍스 셰이더의 aVertexPosition 애트리뷰트를 연결하는 데 사용됨.
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );

  // 위 방법 외에도 gl.bindAttribLocation()을 이용해 링크 전에 어떤 인덱스를 애트리뷰트에 바인딩할지 지정할 수 있음.
  // 인덱스를 지정하면 그리기 과정 중에 해당 인덱스를 사용해 애트리뷰트에 접근할 수 있음.
}

// 셰이더를 만든 후 버텍스 데이터를 저장할 버퍼를 설정하는 단걔.
function setupBuffers() {
  // webGLBuffer 객체를 만들고, 전역 변수인 vertextBuffer에 할당
  vertexBuffer = gl.createBuffer();

  // 위에서 만든 webGLBuffer 객체를 gl.ARRAY_BUFFER에 바인딩
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // x는 오른쪽, y는 위쪽, z는 화면바깥쪽
  const triangleVertices = [0.0, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0];
  // bufferData()를 통해 위의 버텍스 데이터를 바인딩된 webGLBuffer 객체에 기록.
  // 이를 통해 웹지엘이 gl.createBuffer()를 통해 만들어진 버퍼 객체에 어떤 데이터가 있는지 구분하게 됨.
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(triangleVertices),
    gl.STATIC_DRAW
  );

  // 장면이 그려질 때 필요함. 좋은 방법은 아님(왜?)
  vertexBuffer.itemSize = 3;
  vertexBuffer.numberOfItems = 3;
}

function draw() {
  // 뷰포트 초기화. 원점이 (0, 0)
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // gl.createColor()로 결정된 색상으로 색상 버퍼를 채움
  gl.clear(gl.COLOR_BUFFER_BIT);

  // setupBuffers()에서 웹지엘 객체를 생성하고 gl.bindBuffer() 메소드를 이용해 gl.ARRAY_BUFFER 타깃에 바인딩.
  // gl.bufferData()를 통해 버텍스 데이터를 바인딩된 버퍼로 전송
  // 아래 함수를 통해 어떤 애트리뷰트가 바인딩된 버퍼 객체의 버텍스 데이터를 입력값으로 사용할지 결정
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute, // 버텍스 애트리뷰트에 현재 gl.ARRAY_BUFFER 타깃에 바인딩된 webGLBuffer 객체 할당
    vertexBuffer.itemSize, // 애트리뷰트 한개의 요소 개수나 크기 지정
    gl.FLOAT, // 버퍼 객체의 값을 float으로 해석하도록 지정
    false, // 정규화 플래그. float이 아닌 데이터를 float으로 변환할지 정함
    0, // stride. 값이 0인 경우 메모리 상에 연속적으로 저장되어 있음을 의미
    0 // 버퍼의 오프셋. 예제의 데이터는 버퍼의 시작점부터 시작하므로 0
  );

  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems);
}

function startup() {
  const canvas = document.getElementById("canvas");
  gl = createGLContext(canvas);

  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  draw();
}

startup();
