# Mobile Web Specialist Certification Course
---
## _Restaurant Reviews_

### Project Overview:

The **Restaurant Reviews** project, is a mobile-ready web application, that allow the user look for a restaurant nearby; you can filter restaurants by Neighborhoods and Cuisines and also locate the restaurants in a google maps.

After you find your choice, you can navigate to the details of a restaurant, where you can find more information like Opening hours, ratings and reviews.

### Specification

This mobile-ready web application implement the following features:

* **Resposive Design** so it works and the look & feel is nice in all kind of devices.
* **Service Worker** and **Cache API** in order to provde offline capabilities for the pages that the user had visited
* Implement a **focus** strategy to provide easy navigation for no mouse user.
* **ARIA** and **Sematics** specification in order to provdide the correct information for tools like ChromeVox and help people with some disabilities.
* Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. 

### Technical Notes

* You can serve this mobile-ready web app using the SimpleHTTPServer module from pyhton with the following command:`python -m SimpleHTTPServer 8000`.
* I use grunt to serve diferent images sizes in relation with the viewport width. The command task is defined in the Grintfile.js and can be executed the command `grunt`. This command execute the defaul task that include the following sequences of task:
>> 1. `grunt clean`: delete the `img/` directory and all the files inside of it.
>> 2. `grunt mkdir`: create a directory called `img/` at the root directory of the of this project.
>> 3. `grunt copy`: copy the original image files from `images/` directory to the new one created directory `img/`.
>> 4. `grunt responsive_images`: procees all the images into a specific size and compresion level using ImageMagik.


