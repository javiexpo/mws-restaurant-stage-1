module.exports = function(grunt) {

    grunt.initConfig({
      responsive_images: {
        dev: {
          options: {
            engine: 'im',
            sizes: [{
              width: '360px',
              suffix: '',
              quality: 100
            },
            {
              width: '800px',
              suffix: '',
              quality: 100
            }]
          },
  
          /*
          You don't need to change this part if you don't change
          the directory structure.
          */
          files: [{
            expand: true,
            src: ['*.{gif,jpg,png}'],
            cwd: 'images/',
            dest: 'img/'
          }]
        }
      },
  
      /* Clear out the images directory if it exists */
      clean: {
        dev: {
          src: ['img'],
        },
      },
  
      /* Generate the images directory if it is missing */
      mkdir: {
        dev: {
          options: {
            create: ['img']
          },
        },
      },
  
      /* Copy the "fixed" images that don't go through processing into the images/directory */
      copy: {
        dev: {
          files: [{
            expand: false,
            flatten: true,
            filter: 'isFile',
            cwd: 'images/',
            src: 'images/*.{gif,jpg,png}',
            dest: 'img/'
          }]
        },
      },
    });
    
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
  
  };