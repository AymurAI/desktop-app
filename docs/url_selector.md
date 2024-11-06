# URL Selector

En la pantalla de inicio el usuario puede elegir cómo desea conectarse a la API de AyMurAI. Hay dos opciones:

- De manera local: esto significa, levantando Docker localmente ya sea de forma manual o utilizando el ejecutable desarrollado por el equipo de Collective AI para levantar la API utilizando **[Miniconda](https://docs.anaconda.com/miniconda/)**.

- A través de un servidor: los distintos juzgados pueden tener servidores propios a las que se accede a través de su URL.

  Por razones de seguridad, no es conveniente que estas URLs estén en el código de la aplicación, por lo cual el usuario deberá ingrearlas manualmente.

  A fin de mejorar la experiencia de uso, la URL se preserva y autocompleta evitando así que el usuario tenga que reingresarla cada vez que inicia la aplicación.
