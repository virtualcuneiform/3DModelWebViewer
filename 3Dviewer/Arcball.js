function Arcball(newWidth, newHeight) {
  this.position = new THREE.Vector3(0,0,0);
  this.oldPosition = new THREE.Vector3(0,0,0);
  this.safePosition = new THREE.Vector3(0,0,0);

  this.rotation = new THREE.Quaternion(0,0,0,1.0);
  this.oldRotation = new THREE.Quaternion(0,0,0,1.0);
  this.viewRotation = new THREE.Quaternion(0,0,0,1.0);
  this.safeRotation = new THREE.Quaternion(0,0,0,1.0);

  this.AdjustWidth = 1.0 / ((newWidth  - 1.0) * 0.5);
  this.AdjustHeight = 1.0 / ((newHeight  - 1.0) * 0.5);
  
  this.startVec = new THREE.Vector3();
  this.endVec = new THREE.Vector3();
  
  this.startPoint = new THREE.Vector3();
  this.xVector = new THREE.Vector3();
  this.yVector = new THREE.Vector3();
  this.moveVectors = new THREE.Matrix3();
  
  this.animateTarget = {q:null, p:null};
  this.isAnimating = false;
  
  this.EPSILON = 1e-8;  
}

Arcball.prototype.resize = function(newWidth, newHeight){
  this.AdjustWidth = 1.0 / ((newWidth  - 1.0) * 0.5);
  this.AdjustHeight = 1.0 / ((newHeight  - 1.0) * 0.5);
}

Arcball.prototype.mouseDown = function(mx, my, isRotating) {
  if(isRotating){
    this.oldRotation.copy(this.rotation);
    this.startVec = this.mapToSphere(mx, my);
  } else {
	this.startPoint = new THREE.Vector3(mx, my, 0);
	this.oldPosition.copy(this.position);
  }
}

Arcball.prototype.drag = function(mx, my, isRotating) {
  if(isRotating){	
  this.endVec = this.mapToSphere(mx, my);
  var perp = new THREE.Vector3();
  perp.crossVectors(this.startVec, this.endVec);
  var newRotation = new THREE.Quaternion();
  if(perp.length() > this.EPSILON){
	newRotation.x = perp.x;
	newRotation.y = perp.y;
	newRotation.z = perp.z;
	newRotation.w = this.startVec.dot(this.endVec);
  } else {
	newRotation.set(0,0,0,1.0);  
  }
  this.rotation.copy(this.viewRotation);
  this.rotation.conjugate();
  this.rotation.multiply(newRotation);
  this.rotation.multiply(this.viewRotation);  
  this.rotation.multiply(this.oldRotation);
  this.rotation.normalize();
  } else {
	var mouseMove = new THREE.Vector3(mx, my, 0);
	mouseMove.sub(this.startPoint);
	mouseMove.applyMatrix3(this.moveVectors);
//	this.position = new THREE.Vector3(this.oldPosition.x + mouseMove.x / 10.0, this.oldPosition.y - mouseMove.y / 10.0, this.oldPosition.z);	  
    this.position.copy(this.oldPosition);
	this.position.add(mouseMove);	
  }
}

Arcball.prototype.startAnimation = function(target){
	this.isAnimating = true;
	this.oldPosition.copy(this.position);
	this.oldRotation.copy(this.rotation);
  this.animateTarget = target;
  var dist = this.position.clone().sub(target.p).length();
  var rotv = new THREE.Vector3(1,0,0);
  var rot = rotv.clone().applyQuaternion(this.rotation.clone().conjugate().multiply(target.q)).sub(rotv).length();
  return 0.006/Math.min(1,Math.max(0.3,Math.max(rot/2, dist/50)));
}

Arcball.prototype.updateAnimation = function(a){
	if(this.isAnimating){
	this.position.copy(this.oldPosition);
	this.position.multiplyScalar(1-a);
	var tPos = new THREE.Vector3();
	tPos.copy(this.animateTarget.p);
	tPos.multiplyScalar(a);
	this.position.add(tPos);
	
	this.rotation.copy(this.oldRotation);
	this.rotation.slerp(this.animateTarget.q, a);
	}
}

Arcball.prototype.setVectors = function(vx, vy){
  this.moveVectors.set(vx.x, vy.x, 0, vx.y, vy.y, 0, vx.z, vy.z, 0);
}

Arcball.prototype.mapToSphere = function(x, y){
	var temp = new THREE.Vector2(x * this.AdjustWidth - 1.0, 1.0 - y * this.AdjustHeight);
	var len = temp.length();
	if(len > 1.0){
		temp.normalize();
		len = 1.0;
	}
	return new THREE.Vector3(temp.x, temp.y, Math.sqrt(1.0 - len));
}
Arcball.prototype.getState = function(){
	var ret = {pos: new THREE.Vector3(), rot: new THREE.Quaternion()};
	ret.pos.copy(this.position);
	ret.rot.copy(this.rotation);
	return ret;
}
Arcball.prototype.setState = function(s){
	this.position.copy(s.pos);
	this.rotation.copy(s.rot);
}

Arcball.prototype.hasMoved = function(){
  return ~(this.position.equals(this.safePosition) && this.rotation.equals(this.safeRotation));
}
Arcball.prototype.saveState = function(){
  this.safeRotation.copy(this.rotation);
  this.safePosition.copy(this.position);
}
Arcball.prototype.restoreState = function(){
  this.rotation.copy(this.safeRotation);
  this.position.copy(this.safePosition);
}

Arcball.exports = Arcball;
