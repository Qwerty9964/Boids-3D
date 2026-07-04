world_size=30

perception_distance=8.5
cohesion_force=0.015
alignment_force=0.009
base_speed=0.16



AFRAME.registerComponent('boid-move',{

    init: function() {
        this.el.object3D.position.x=random_position_generate(14)
        this.el.object3D.position.y=random_position_generate(14)
        this.el.object3D.position.z=random_position_generate(14)


        this.direction = new THREE.Vector3(
            random_position_generate(10),
            random_position_generate(10),
            random_position_generate(10)
        )

        this.direction.normalize()
        console.log(this.direction)
        this.speed=base_speed
        this.velocity=this.direction.clone().multiplyScalar(this.speed)
        this.speed_noise=0

    },

    tick: function() {
        this.direction.normalize()
        this.speed=base_speed
        this.speed+=this.speed_noise
        this.velocity=this.direction.clone().multiplyScalar(this.speed)
        this.el.object3D.position.add(this.velocity)
    }

})

AFRAME.registerComponent('boid-control',{
    init: function() {
        this.scene=document.querySelector('a-scene')
    },

    tick: function(time, timedelta) {

        let fps = 1000/timedelta

        //ui

        document.getElementById("cohesion").addEventListener("input", function(e) {
            cohesion_force = parseFloat(e.target.value)
        })

        document.getElementById("alignment").addEventListener("input", function(e) {
            alignment_force = parseFloat(e.target.value)
        })

        document.getElementById("speed").addEventListener("input", function(e) {
            base_speed = parseFloat(e.target.value)
        })

        document.getElementById("fps").textContent = Math.round(fps);




        this.scene.querySelectorAll('.boid').forEach((boid) => {

            let horizontal = Math.sqrt(boid.components["boid-move"].direction.z ** 2 + boid.components["boid-move"].direction.x ** 2 )

            let roty = Math.atan2(boid.components["boid-move"].direction.x, boid.components["boid-move"].direction.z)
            let rotz = Math.atan2(boid.components["boid-move"].direction.y, horizontal)

            boid.object3D.rotation.y = roty
            boid.object3D.rotation.x = -1*(rotz)


            if (boid.object3D.position.x >= world_size || boid.object3D.position.x <= (world_size*(-1))){
                boid.components["boid-move"].direction.x *= -1
            }

            if (boid.object3D.position.y >= world_size || boid.object3D.position.y <= (world_size*(-1))){
                boid.components["boid-move"].direction.y *= -1
            }

            if (boid.object3D.position.z >= world_size || boid.object3D.position.z <= (world_size*(-1))){
                boid.components["boid-move"].direction.z *= -1
            }



            boid.components["boid-move"].speed_noise += random_position_generate(0.5)*0.001


            let boid_neighbors=0
            let center = new THREE.Vector3(0,0,0)
            let dir_sum = new THREE.Vector3(0,0,0)
            let noise = new THREE.Vector3(
            random_position_generate(5),
            random_position_generate(5),
            random_position_generate(5)).normalize().multiplyScalar(0.01)

            this.scene.querySelectorAll('.boid').forEach((other) => {

                if (boid!=other){
                    let offset=other.object3D.position.clone().sub(boid.object3D.position)
                    let distance=offset.length()

                    if (distance<perception_distance){
                        boid_neighbors+=1
                        center.add(other.object3D.position)
                        dir_sum.add(other.components["boid-move"].direction.clone().normalize())

                    }
                }
                
            });

            if (boid_neighbors!=0){
                //cohesion
                center.divideScalar(boid_neighbors)

                let dv = center.clone().sub(boid.object3D.position)

                dv = dv.normalize().multiplyScalar(cohesion_force)

                
                boid.components["boid-move"].direction.normalize()

                //alignment
                dir_sum.divideScalar(boid_neighbors)
                dir_sum.normalize()

                let steering_force=(dir_sum.clone().sub(boid.components["boid-move"].direction)).multiplyScalar(alignment_force)

                this.scene.querySelectorAll('.boid').forEach((other) => {
                    if (boid===other) return
                    let offset=boid.object3D.position.clone().sub(other.object3D.position)
                    let distance = offset.length()
                    
                    if (distance<=4){
                        boid.components["boid-move"].direction.add(offset.normalize().divideScalar(distance**1.08))
                        boid.components["boid-move"].direction.normalize()
                    }
                    
                });


                boid.components["boid-move"].direction.add(steering_force)
                boid.components["boid-move"].direction.add(dv)
                boid.components["boid-move"].direction.add(noise)
                
                boid.components["boid-move"].direction.normalize()

            }
            

        });

       

        
        
    }
})

function random_position_generate(range) {
    if (Math.random()<0.5) {
        return Math.random()*range
    } else {
        return Math.random()*(-1)*range
    }

}