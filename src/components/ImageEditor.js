import React, { Component } from 'react';
import './style.css';

class ImageEditor extends Component{
  constructor(props) {
    super(props);
    const boxState = new Map();
    boxState.set('width', 0);
    boxState.set('height', 0);
    boxState.set('x', 0);
    boxState.set('y', 0);
    this.state = {
      edgeState: [
        {
          onLeftEdge: false,          
          isResizingLeft: false,
        },
        {
          onRightEdge: false,
          isResizingRight: false,
        },
        {
          onTopEdge: false,          
          isResizingTop: false,
        },
        {
          onBottomEdge : false,          
          isResizingBottom: false,
        },
        {
          onCenter: false,          
          isMoving: false,
        }        
      ],
      boxState,
      imgOrientation: '',
      boxRatio: '',
      uploadedImgRatio: '',
      uploadedImg: '',
      uploadedWidth: '',
      uploadedHeight: '',
      editedImg: '',
      inputWidthValue: '',
      inputHeightValue: '',
      isToolbarShow: false,
      isinputWidthValChanging: false,
      isinputHeightValChanging: false,
      isUploadedImgMinified: false,
      isMakingCanvas: false,
      isChangingImg: false,
      isDragging: false,
      isOnCorner: false,
      isCornerResize: false,
      isSquare: false,
      isScale: false,
      isCircle: false,
      redraw: false,
      isTouching: false,
      margin: 10,
      lastClientX: '',
      lastClientY: '',
    };
    this.dragStart = this.dragStart.bind(this);
    this.draggIng = this.draggIng.bind(this);
    this.dragStop = this.dragStop.bind(this);
    this.setBoxState = this.setBoxState.bind(this);
    this.makePhoto = this.makePhoto.bind(this);
    this.onFileSelected = this.onFileSelected.bind(this);
    this.setImageStyle = this.setImageStyle.bind(this);
    this.changeBoxState = this.changeBoxState.bind(this);
  }
  componentDidMount() {
    window.addEventListener('mousedown', this.dragStart);
    window.addEventListener('mousemove', this.draggIng);
    window.addEventListener('mouseup', this.dragStop);
    window.addEventListener('touchstart', (e) => {
      this.setState({
        isTouching: true,
        margin: 20,
      });
      this.draggIng(e.touches[0]);
    });
    window.addEventListener('touchmove', (e) => {
      this.draggIng(e.touches[0]);
    });
    window.addEventListener('touchend', this.dragStop);
  }
  componentDidUpdate() {
    const image = new Image();
    image.addEventListener('load', (e) => {
      const {
        editedImg,
        uploadedImg,
        isChangingImg,
        imgOrientation,
      } = this.state;
      const resetOrientation = (srcBase64, srcOrientation, callback) => {
        const img = new Image();
        img.addEventListener('load', () => {
          const width = img.width;
          const height = img.height;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext("2d");
          // set proper canvas dimensions before transform & export
          if (4 < srcOrientation && srcOrientation < 9) {
            canvas.width = height;
            canvas.height = width;
          } else {
            canvas.width = width;
            canvas.height = height;
          }
          // transform context before drawing image
          switch (srcOrientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height , width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
            default: break;
          }
          // draw image
          ctx.drawImage(img, 0, 0);
          // export base64
          return callback(canvas.toDataURL());
        })
        img.src = srcBase64;
      }
      if (isChangingImg) {
        resetOrientation(uploadedImg, imgOrientation, (newSrc) => {
          this.setState({
            editedImg: newSrc,
          });
        });
        const newImg = new Image();
        newImg.addEventListener('load', (e) => {
          const root = this.root;
          const wrapper = this.wrapper;
          const outsideImg = this.outsideImg;
          const insideImg = this.insideImg;
          const uploadedImgWidth = e.target.width;
          const uploadedImgHeight = e.target.height;
          const wrapperStyle = +wrapper.style.width.replace('px', '') || 
                +wrapper.style.height.replace('px', '');
          const outsideImgStyle = +outsideImg.getAttribute('width') || 
                +outsideImg.getAttribute('height');
          const insideImgStyle = +insideImg.getAttribute('width') || 
                +insideImg.getAttribute('height');
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;
          if (!wrapperStyle || !outsideImgStyle || !insideImgStyle) {
            const boxState = new Map();
            if (uploadedImgHeight > windowHeight) {
              const ratio = Math.max(uploadedImgWidth, uploadedImgHeight) / 
                    Math.min(uploadedImgWidth, uploadedImgHeight);
              let minifiedWidth, minifiedHeight;
              if (uploadedImgWidth > uploadedImgHeight) {
                minifiedWidth = windowHeight * ratio;
              } else {
                minifiedWidth = windowHeight / ratio;
              }
              if (minifiedWidth > windowWidth) {
                if (uploadedImgWidth > uploadedImgHeight) {
                  minifiedHeight = windowWidth / ratio;
                } else {
                  minifiedHeight = windowWidth * ratio;
                }
                this.setState({
                  uploadedImgRatio: (minifiedWidth / windowWidth) * 
                  (uploadedImgHeight / windowHeight),
                });
                this.setImageStyle(
                  windowWidth, 
                  minifiedHeight,
                  root,
                  wrapper, 
                  outsideImg, 
                  insideImg
                );              
              } else {
                this.setState({
                  uploadedImgRatio: uploadedImgHeight / windowHeight,
                });         
                this.setImageStyle(
                  minifiedWidth, 
                  windowHeight,
                  root,
                  wrapper, 
                  outsideImg, 
                  insideImg
                );
              }
              this.setState({
                isUploadedImgMinified: true,
              });
              boxState.set('x', (minifiedWidth / 2) - 50);
              boxState.set('y', (windowHeight / 2) - 50);
              boxState.set('width', 100);
              boxState.set('height', 100);
            } else {                
              this.setImageStyle(
                uploadedImgWidth, 
                uploadedImgHeight,
                root,
                wrapper,
                outsideImg,
                insideImg
              );
              boxState.set('x', (uploadedImgWidth / 2) - 50);
              boxState.set('y', (uploadedImgHeight / 2) - 50);
              boxState.set('width', 100);
              boxState.set('height', 100);               
            }
            this.setState({ boxState });
          } else {
            this.setState({
              isToolbarShow: true,
              isChangingImg: false,
            });
          }          
        });
        newImg.src = editedImg;
      }
      if (this.state.isMakingCanvas) {
        const context = this.canvas.getContext('2d');
        this.makePhoto(context);      
      }      
    });
    image.src = this.state.uploadedImg;
  }
  componentWillUnmount() {
    window.removeEventListener('mousemove', this.draggIng);
    window.removeEventListener('mouseup', this.dragStop);
    window.removeEventListener('touchmove', this.draggIng);
    window.removeEventListener('touchend', this.dragStop);
  }
  setImageStyle(width, height, ...elems) {
    elems.forEach((elem) => {
      if (elem === this.wrapper || elem === this.root) {
        elem.style.width = `${width}px`;
        elem.style.height = `${height}px`;        
      } else {
        elem.width = width;
        elem.height = height;
      }
    });
  }
  dragStart(e) {
    const { edgeState } = this.state;
    const startDragEdges = JSON.parse(JSON.stringify(edgeState));
    this.box.style.outline = '3px solid #eb9c0b';
    startDragEdges.forEach((startEdges) => {
      let stratDrag = false;
      for (const props in startEdges) {
        if (startEdges[props] === true) {
          stratDrag = true;
        }
        if (stratDrag === true) {
          startEdges[props] = true;
        }
      }
    });
    this.setState({
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      draggingElem: this.box,
      isDragging: true,
      edgeState: startDragEdges,
    });
  }
  draggIng(e) {
    const {
      margin,
      isDragging,
      isScale,
      lastClientX,
      lastClientY,
      edgeState,
      boxState,
      boxRatio,
    } = this.state;
    const wb = this.wrapper.getBoundingClientRect();
    let b = this.box.getBoundingClientRect();
    let x = e.clientX - b.left;
    let y = e.clientY - b.top;
    let trueLength = 0;
    const detectEdgesResult = JSON.parse(JSON.stringify(this.state.edgeState));
    const excludeTopAndBottomEdge = y >= 0 && y <= b.height;
    const excludeLeftAndRightEdge = x >= 0 && x <= b.width;
    detectEdgesResult.forEach((mouse) => {
      if (mouse.hasOwnProperty('onLeftEdge')) {
        if (x < margin &&
            x > -margin &&
            excludeTopAndBottomEdge
        ) {
          mouse.onLeftEdge = true;
          trueLength++;
        } else {
          mouse.onLeftEdge = false;
        }          
      }
      if (mouse.hasOwnProperty('onRightEdge')) {
        if (x >= (b.width - margin) &&
            x <= (b.width + margin) && 
            excludeTopAndBottomEdge
        ) {
          mouse.onRightEdge = true;
          trueLength++;
        } else {
          mouse.onRightEdge = false;
        }
      }
      if (mouse.hasOwnProperty('onTopEdge')) {
        if (y < margin &&
            y > -margin &&
            excludeLeftAndRightEdge
        ) {
          mouse.onTopEdge = true;
          trueLength++;
        } else {
          mouse.onTopEdge = false;
        }  
      } 
      if (mouse.hasOwnProperty('onBottomEdge')) {
        if (y >= (b.height - margin) &&
            y <= (b.height + margin) &&
            excludeLeftAndRightEdge
        ) {
          mouse.onBottomEdge = true;
          trueLength++;
        } else {
          mouse.onBottomEdge = false;
        }  
      }
      if (mouse.hasOwnProperty('onCenter')) {
        if (x > margin &&
            x <= (b.width - margin) &&
            y > margin &&
            y <= (b.height - margin)
        ) {
          mouse.onCenter = true;
        } else {
          mouse.onCenter = false;
        }
      }
    });
    this.setState({ edgeState: detectEdgesResult });
    if (this.state.isTouching) {
      this.dragStart(e);
    }

    if (isDragging) {
      this.setState({
        redraw: true,
      })
      const resizeState = this.caculateResizeState('is', edgeState);
      const {
        isResizingLeft,
        isResizingRight,
        isResizingTop,
        isResizingBottom,
        isMoving,
      } = resizeState;
      const animate = () => {
        if (!this.state.redraw) return;
        this.setState({
          redraw: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
        });
        b = this.box.getBoundingClientRect();
        x = e.clientX - b.left;
        y = e.clientY - b.top;
        requestAnimationFrame(animate);
        let lastX = lastClientX;
        let lastY = lastClientY;
        let newScrollX = (- lastX + e.clientX);
        let newScrollY = (- lastY + e.clientY);
        let nowWidth, nowX, nowHeight, nowY;
        let scaleScrollX;
        let scaleScrollY;
        if (isScale) {
          let minValue;
          if ((newScrollX > 0 && newScrollY > 0) || 
            (newScrollX < 0 && newScrollY < 0)
          ) {
              minValue = Math.min(newScrollX, newScrollY);
              scaleScrollX = minValue;
              scaleScrollY = minValue;
          } else {
            minValue = Math.min(Math.abs(newScrollX), Math.abs(newScrollY));
            if (newScrollX > 0) {
              scaleScrollX = minValue;
              scaleScrollY = -minValue;
            } else {
              scaleScrollX = -minValue;
              scaleScrollY = minValue;
            }
          }
          if (isResizingLeft && isResizingTop) {
            nowX = boxState.get('x');
            nowY = boxState.get('y');
            nowWidth = boxState.get('width');
            nowHeight = boxState.get('height');
            if (scaleScrollX === -0 || scaleScrollY === -0) {
              scaleScrollX = 0;
              scaleScrollY = 0;
            }
            if (scaleScrollX === scaleScrollY) {
              nowHeight -= scaleScrollY;
              nowY += scaleScrollY;                
              if (nowWidth > nowHeight) {
                scaleScrollX = nowWidth - (nowHeight * boxRatio);
                nowWidth -= scaleScrollX;
                nowX += scaleScrollX;
              } else {
                scaleScrollX = nowWidth - Math.ceil((nowHeight / boxRatio));
                nowWidth -= scaleScrollX;
                nowX += scaleScrollX;
              }
              if (nowX > 0 && nowY > 0 && nowHeight > 0) {
                this.setBoxState(nowX, nowY, nowWidth, nowHeight);
              }
            }
          }
          if (isResizingLeft && isResizingBottom) {
            nowX = boxState.get('x');
            nowY = boxState.get('y');
            nowWidth = boxState.get('width');
            nowHeight = boxState.get('height');
            if (scaleScrollX === -0 || scaleScrollY === -0) {
              scaleScrollX = 0;
              scaleScrollY = 0;
            }
            if ((scaleScrollX < 0 && scaleScrollY > 0) || 
              (scaleScrollX > 0 && scaleScrollY < 0)
            ) {
              nowHeight += scaleScrollY;             
              if (nowWidth > nowHeight) {
                scaleScrollX = nowWidth - (nowHeight * boxRatio);
                nowWidth -= scaleScrollX;
                nowX += scaleScrollX;
              } else {
                scaleScrollX = nowWidth - Math.ceil((nowHeight / boxRatio));
                nowWidth -= scaleScrollX;
                nowX += scaleScrollX;
              }
              if (((b.top + nowHeight) < wb.bottom) && nowX > 0 && nowHeight > 0) {
                this.setBoxState(nowX, undefined, nowWidth, nowHeight);
              }
            }
          }
          if (isResizingRight && isResizingTop) {
            nowX = boxState.get('x');
            nowY = boxState.get('y');
            nowWidth = boxState.get('width');
            nowHeight = boxState.get('height');
            if (scaleScrollX === -0 || scaleScrollY === -0) {
              scaleScrollX = 0;
              scaleScrollY = 0;
            }
            if ((scaleScrollX < 0 && scaleScrollY > 0) || 
              (scaleScrollX > 0 && scaleScrollY < 0)
            ) {
              nowHeight -= scaleScrollY;
              nowY += scaleScrollY;                
              if (nowWidth > nowHeight) {
                scaleScrollX = nowWidth - (nowHeight * boxRatio);
                nowWidth -= scaleScrollX;
              } else {
                scaleScrollX = nowWidth - Math.ceil((nowHeight / boxRatio));
                nowWidth -= scaleScrollX;
              }
              if (nowY > 0 && ((b.left + nowWidth) < wb.right) && nowHeight > 0) {
                this.setBoxState(undefined, nowY, nowWidth, nowHeight);
              }
            }
          }
          if (isResizingRight && isResizingBottom) {
            nowWidth = boxState.get('width');
            nowHeight = boxState.get('height');
            if (scaleScrollX === -0 || scaleScrollY === -0) {
              scaleScrollX = 0;
              scaleScrollY = 0;
            }
            if (scaleScrollX === scaleScrollY) {
              nowHeight += scaleScrollY;             
              if (nowWidth > nowHeight) {
                scaleScrollX = nowWidth - (nowHeight * boxRatio);
                nowWidth -= scaleScrollX;
              } else {
                scaleScrollX = nowWidth - Math.ceil((nowHeight / boxRatio));
                nowWidth -= scaleScrollX;
              }
              if (((b.top + nowHeight) < wb.bottom) && 
                ((b.left + nowWidth) < wb.right) && 
                nowHeight > 0
              ) {
                this.setBoxState(undefined, undefined, nowWidth, nowHeight);
              }
            }
          }              
        } else {
          if (isResizingLeft) {
            nowX = boxState.get('x');
            nowY = boxState.get('y');
            nowWidth = boxState.get('width');
            nowWidth -= newScrollX;
            nowX += newScrollX;
            if (nowX > 0 && nowWidth > 0) {
              this.setBoxState(nowX, undefined, nowWidth, undefined);
            }
          }
          if (isResizingRight) {
            nowWidth = boxState.get('width');
            nowWidth += newScrollX;
            if (((b.left + nowWidth) < wb.right) && nowWidth > 0) {
              this.setBoxState(undefined, undefined, nowWidth, undefined);
            }
          }
          if (isResizingTop) {
            nowX = boxState.get('x');
            nowY = boxState.get('y');
            nowHeight = boxState.get('height');
            nowHeight -= newScrollY;
            nowY += newScrollY;
            if (nowY > 0 && nowHeight > 0) {
              this.setBoxState(undefined, nowY, undefined, nowHeight);
            }
          }
          if (isResizingBottom) {
            nowHeight = boxState.get('height');
            nowHeight += newScrollY;
            if (((b.top + nowHeight) < wb.bottom) && nowHeight > 0) {
              this.setBoxState(undefined, undefined, undefined, nowHeight);
            }
          }          
        }
        if (isMoving) {
          nowX = boxState.get('x');
          nowY = boxState.get('y');
          nowWidth = boxState.get('width');
          nowHeight = boxState.get('height');
          nowX += newScrollX;
          nowY += newScrollY;
          if (nowX >= 0 && 
            nowY >= 0 && 
            ((nowY + nowHeight) <= wb.height) && 
            ((nowX + nowWidth) <= wb.width)
          ) {
            this.setBoxState(nowX, nowY, undefined, undefined);
          }
        }
      }
      animate();
    }
  }
  setBoxState(x, y, width, height) {
    const isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
    const { boxState } = this.state;
    let cloneBoxState;
    if (isIE11) {
      cloneBoxState = new Map();
      boxState.forEach((val, key) => {
        cloneBoxState.set(key, val);
      });
    } else {
      cloneBoxState = new Map(boxState);
    }
    if (x) {
      cloneBoxState.set('x', Math.round(x));
    }
    if (y) {
      cloneBoxState.set('y', Math.round(y));
    }
    if (width) {
      cloneBoxState.set('width', Math.round(width));
    }
    if (height) {
      cloneBoxState.set('height', Math.round(height));
    }
    this.setState({
      boxState: cloneBoxState,
    });    
  }
  caculateResizeState(action, edgeState) {
    let obj = {};
    edgeState.forEach((resizingEdges) => {
      for (const p in resizingEdges) {
        if (p.indexOf(action) !== -1) {
          obj[p] = resizingEdges[p];
        }
      }
    });
    return obj;
  }
  dragStop() {
    const stopDragEdges = JSON.parse(JSON.stringify(this.state.edgeState));
    this.box.style.outline = '';
    stopDragEdges.forEach((stopEdges) => {
      for (const props in stopEdges) {
        if (stopEdges[props] === true) {
          stopEdges[props] = false;
        }
      }
    });
    this.setState({
      redraw: false,
      isTouching: false,
      isDragging: false,
      edgeState: stopDragEdges,
    });
  }
  checkInput (e, actionType) {
    if (e.target.value.match(/\D/g)) {
      alert('請輸入數字喔!');
    } else {
      if (actionType === 'changeWidth') {
        this.setState({
          isinputWidthValChanging: true,
          inputWidthValue: +e.target.value,
        });
      } else if (actionType === 'changeHeight') {
        this.setState({
          isinputHeightValChanging: true,
          inputHeightValue: +e.target.value,
        });
      }
    }
  }
  changeBoxState (actionType) {
    const wb = this.wrapper.getBoundingClientRect();
    const b = this.box.getBoundingClientRect(); 
    const isIE11 = !!window.MSInputMethodContext && 
                   !!document.documentMode;
    const {
      boxState,
      isSquare,
      inputWidthValue,
      inputHeightValue,
    } = this.state;
    let cloneBoxState;
    if (isIE11) {
      cloneBoxState = new Map();
      boxState.forEach((val, key) => {
        cloneBoxState.set(key, val);
      });
    } else {
      cloneBoxState = new Map(boxState);
    }     
    if (actionType === 'changeWidth') {
      const isExceedImageWidth = (inputWidthValue- this.box.clientWidth) > 
      (wb.right - b.right);
      if (isExceedImageWidth) {
        alert('框的寬不能大於圖片寬喔!');
        this.setState({
          inputWidthValue: '',
          isinputWidthValChanging: false,
        });
        return;
      }
      if (isSquare) {
        cloneBoxState.set('width', inputWidthValue);
        cloneBoxState.set('height', inputWidthValue);
      } else {
        cloneBoxState.set('width', inputWidthValue);
      }
      this.setState({
        inputWidthValue: '',
        isinputWidthValChanging: false,
        boxState: cloneBoxState,
        boxRatio: Math.max(inputWidthValue, boxState.get('height')) / 
                  Math.min(inputWidthValue, boxState.get('height')),
      });
    } else if (actionType === 'changeHeight') {
      const isExceedImageHeight = (inputHeightValue - this.box.clientHeight) > 
                                  (wb.bottom - b.bottom);
      if (isExceedImageHeight) {
        alert('框的高不能大於圖片高喔!');
        this.setState({
          inputHeightValue: '',
          isinputHeightValChanging: false,
        });        
        return;
      }
      if (isSquare) {
        cloneBoxState.set('width', inputHeightValue);
        cloneBoxState.set('height', inputHeightValue);         
      } else {
        cloneBoxState.set('height', inputHeightValue);          
      }
      this.setState({
        inputHeightValue: '',
        isinputHeightValChanging: false,
        boxState: cloneBoxState,
        boxRatio: Math.max(inputHeightValue, boxState.get('height')) / 
        Math.min(inputHeightValue, boxState.get('height')),
      });
    } else if (actionType === 'changeToSquare') {
      const boxWidth = cloneBoxState.get('width');
      const boxHeight = cloneBoxState.get('height');
      if (boxWidth > boxHeight) {
        cloneBoxState.set('width', boxHeight);
      } else {
        cloneBoxState.set('height', boxWidth);
      }
      this.setState({
        boxState: cloneBoxState,
        boxRatio: 1,
      });
    }
  }  
  makePhoto() {
    const {
      isUploadedImgMinified,
      uploadedImgRatio,
      boxState,
      isCircle,
    } = this.state;
    const c = this.canvas;
    const nowWidth = boxState.get('width');
    const nowHeight = boxState.get('height');
    const ctx = c.getContext("2d");
    if (isCircle) {
      ctx.strokeStyle= "none";
      ctx.lineWidth = 0;
      ctx.arc(
        (nowWidth / 2), 
        (nowWidth / 2), 
        (nowWidth / 2), 
        0, 
        Math.PI*2, 
        true
      );
      ctx.clip();
      ctx.clearRect(0, 0, nowWidth, nowHeight);
    }
    if (isUploadedImgMinified) {
      ctx.drawImage(
        this.insideImg, 
        boxState.get('x') * uploadedImgRatio,
        boxState.get('y') * uploadedImgRatio,
        nowWidth * uploadedImgRatio, 
        nowHeight * uploadedImgRatio,
        0, 
        0,
        nowWidth, 
        nowHeight 
      );
    } else {
      ctx.drawImage(
        this.insideImg, 
        boxState.get('x'), 
        boxState.get('y'), 
        nowWidth, 
        nowHeight, 
        0, 
        0,
        nowWidth, 
        nowHeight
      );        
    }
    if (!window.navigator.msSaveOrOpenBlob) {
      this.downloadButton.href = this.canvas.toDataURL();
    }
  }
  onFileSelected(e) {
    const { boxState } = this.state;
    const target = e.target;
    if (!target.files[0]) {
      return;
    }    
    this.root.style.height = 0;
    this.setImageStyle(
      0, 
      0,
      this.wrapper,
      this.outsideImg,
      this.insideImg
    );
    const getOrientation = (file, callback) => {
      const newReader = new FileReader();
      newReader.addEventListener('load', (e) => {
        const view = new DataView(e.target.result);
        if (view.getUint16(0, false) !== 0xFFD8) return callback(-2);
        const length = view.byteLength;
        let offset = 2;
        while (offset < length) {
          const marker = view.getUint16(offset, false);
          offset += 2;
          if (marker === 0xFFE1) {
            if (view.getUint32(offset += 2, false) !== 0x45786966) {
              return callback(-1);
            }
            const little = view.getUint16(offset += 6, false) === 0x4949;
            offset += view.getUint32(offset + 4, little);
            const tags = view.getUint16(offset, little);
            offset += 2;
            for (let i = 0; i < tags; i++)
              if (view.getUint16(offset + (i * 12), little) === 0x0112)
                return callback(view.getUint16(offset + (i * 12) + 8, little));
          }
          else if ((marker & 0xFF00) != 0xFF00) break;
          else offset += view.getUint16(offset, false);
        }
        return callback(-1);         
      });
      newReader.readAsArrayBuffer(file.slice(0, 64 * 1024));
    }
    this.setState({
      editedImg: '',
    });
    getOrientation(target.files[0], (orientation) => {
      const file = target.files.item(0);
      const reader = new FileReader();
      reader.addEventListener('load', (e) => {
        this.setState({
          isChangingImg: true,
          imgOrientation: orientation,
          uploadedImg: e.target.result,
        });
      });
      reader.readAsDataURL(file);
    });
    this.setState({
      boxRatio: Math.max(boxState.get('width'), boxState.get('height')) / 
                Math.min(boxState.get('width'), boxState.get('height')),
    });
  }
  render() {
    const { 
      boxState,
      isScale,
      isSquare,
      isCircle,
      inputWidthValue,
      inputHeightValue,
      isToolbarShow,
      isMakingCanvas,
      isinputWidthValChanging,
      isinputHeightValChanging,
      isChangingImg,
      editedImg,
    } = this.state;
    return (
      <div id="photo_cuter">
        {
          !isChangingImg && !editedImg &&
            <div id="uploadImg"><span>來上傳一張相片吧</span></div>
        }
        {
          isChangingImg &&
            <div id="uploadImg"><span>相片讀取中，請稍候...</span></div>
        }
        <div
          style={
            (() => {
              if (!editedImg || isChangingImg) {
                return {
                  position: 'relative',
                  background: '#fff',
                }
              } else {
                return {
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1b1b1b',
                }
              }
            })()
          }
          className="root" 
          ref={root => this.root = root} 
        >
          <div className="drag__scroll" 
            ref={wrapper => this.wrapper = wrapper} 
            style={{
              visibility: (() => {
                if (!editedImg || isChangingImg) {
                  return 'hidden'
                } else {
                  return 'visible'
                }
              })(),
              width: 0,
              height: 0,
              cursor: (() => {
                const { edgeState } = this.state;
                const cursorMovingState = this.caculateResizeState('on', edgeState);
                const cursorResizingState = this.caculateResizeState('is', edgeState);
                const onLeftEdge = cursorMovingState.onLeftEdge || 
                      cursorResizingState.isResizingLeft;
                const onRightEdge = cursorMovingState.onRightEdge || 
                      cursorResizingState.isResizingRight;
                const onTopEdge = cursorMovingState.onTopEdge || 
                      cursorResizingState.isResizingTop;
                const onBottomEdge = cursorMovingState.onBottomEdge || 
                      cursorResizingState.isResizingBottom;
                const onCenter = cursorMovingState.onCenter || 
                      cursorMovingState.isMoving;
                if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
                  return 'nwse-resize';
                } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
                  return 'nesw-resize';
                } else if (onLeftEdge || onRightEdge) {
                  return 'ew-resize';
                } else if (onTopEdge || onBottomEdge) {
                  return 'ns-resize';
                } else if (onCenter) {
                  return 'move';
                }
              })(),
            }}
          >
            <div className={isCircle ? "content circle" : "content"} 
              ref={ box => this.box = box } 
              style={{
                transform: `translate(${boxState.get('x')}px, ${boxState.get('y')}px)`, 
                width: `${boxState.get('width')}px`, 
                height: `${boxState.get('height')}px`,
                visibility: (() => {
                  if (!editedImg || isChangingImg) {
                    return 'hidden'
                  } else {
                    return 'visible'
                  }
                })(),
              }}
            >
              <img className="img_inside now_allow-drag" 
                ref={ insideImg => this.insideImg = insideImg }
                src={editedImg}
                style={{ 
                  transform: `translate(-${(boxState.get('x'))}px, -${(boxState.get('y'))}px)`,
                  visibility: (() => {
                    if (!editedImg || isChangingImg) {
                      return 'hidden'
                    } else {
                      return 'visible'
                    }
                  })(),
                }}
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
              />
            </div>       
          </div>
          <img className="img_outside now_allow-drag"
            style={{
              visibility: (() => {
                if (!editedImg || isChangingImg) {
                  return 'hidden'
                } else {
                  return 'visible'
                }
              })(),
            }}
            src={editedImg}
            ref={ outsideImg => this.outsideImg = outsideImg }
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
          />
          {
            isMakingCanvas &&
            <canvas
              width={boxState.get('width')}
              height={boxState.get('height')}
              ref={canvas => this.canvas = canvas}
            />
         }
          <div className={
              (() => {
                if (!isToolbarShow || !editedImg) {
                  return 'control_bar';
                } else {
                  return 'control_bar active';
                }
              })()
            }>
            <label>寬</label>
            <input type="text" 
              value={
                isinputWidthValChanging ? 
                  inputWidthValue : 
                boxState.get('width')
              } 
              onChange={(e) => this.checkInput(e, 'changeWidth')}
              onBlur={() => this.changeBoxState('changeWidth')}
              disabled={!editedImg || isChangingImg}
              />            
            <label>高</label>
            <input type="text" 
              value={
                isinputHeightValChanging ? 
                  inputHeightValue : 
                boxState.get('height')
              } 
              onChange={(e) => this.checkInput(e, 'changeHeight')}
              onBlur={() => this.changeBoxState('changeHeight')}
              disabled={!editedImg || isChangingImg}
              />            
            <label>正方形</label>
            <input type="checkbox"
              checked={isSquare}
              onChange={() => {
                this.changeBoxState('changeToSquare');
                if (isScale && !isSquare) {
                  this.setState({
                    isSquare: true,
                  });
                } else {
                  this.setState({
                    isSquare: !isSquare,
                    isScale: !isScale,
                  });
                }
              }}
              disabled={!editedImg || isChangingImg || isCircle}
              />              
            <label>等比例縮放</label>
            <input type="checkbox"
              value={isScale}
              checked={isScale}
              onChange={() => {
                this.setState({
                  isScale: !isScale,
                  boxRatio: Math.max(boxState.get('width'), boxState.get('height')) / 
                  Math.min(boxState.get('width'), boxState.get('height')),
                });
              }}
              disabled={!editedImg || isChangingImg || isCircle || isSquare}
              />
            <label>圓形</label>
            <input type="checkbox"
              checked={isCircle}
              onChange={() => {
                if (isScale && !isCircle) {
                  this.setState({
                    isCircle: true,
                  });
                } else {
                  this.setState({
                    isCircle: !isCircle,
                    isScale: !isScale,
                  });
                }
                this.changeBoxState('changeToSquare');
              }}
              disabled={!editedImg || isChangingImg || isSquare}
              />
          </div>
          <div 
            style={{
              visibility: (() => {
                if (isChangingImg) {
                  return 'hidden'
                } else {
                  return 'visible'
                }
              })()
            }}
          >
            <input 
              id="file" 
              accept="image/*" 
              type="file"
              onClick={() => {
                this.setState({
                  isToolbarShow: false,
                });
              }}
              onChange={this.onFileSelected} 
              />                   
              <input type="button" 
              value={isToolbarShow ? '隱藏工具列' : '顯示工具列'}
              disabled={!editedImg || isChangingImg}
              onClick={() => {
                this.setState({
                  isToolbarShow: !isToolbarShow,
                });
              }}        
            />
            <a 
              href="#" 
              download={!window.navigator.msSaveOrOpenBlob && "photo.jpg"}
              ref={downloadButton => this.downloadButton = downloadButton}
            >
              <input type="button" 
                value="裁切"
                disabled={!editedImg || isChangingImg}
                onClick={() => {
                  if (window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveBlob(this.canvas.msToBlob(), 'photo.jpg');
                  }
                }}
                onMouseOver={() => {
                  this.setState({
                    isMakingCanvas: true,
                  })
                }}
                onMouseOut={() => {
                  this.setState({
                    isMakingCanvas: false,
                  })
                }}              
              />
            </a>            
          </div>
        </div>        
      </div>
    );
  }
}

export default ImageEditor
