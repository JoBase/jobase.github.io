### Welcome to JoBase
JoBase is a really fast Python game library for beginner coders.
It is written in pure C and uses the same modern tools as high-end games like Minecraft.

We now support an online JoBase editor!
Feel free to use it before installing JoBase on your local computer.
Click [here](https://jobase.org/Browser) to try it now.

#### Download Python
To start using JoBase, you will need Python installed.
Visit [python.org](https://www.python.org/downloads) and download the latest version for your computer.

#### Install JoBase
To install JoBase, type the following into the Command Terminal.

```
pip install JoBase
```

If the installation fails, please contact us at <problem@jobase.org> with a full copy of the error and the name of your operating system.
If the installation succeeded, you can continue by typing the following command to run a basic exmaple.

```
python -m JoBase.examples.coin_collector
```

If everything works, you are ready to start coding!
The minimal Python example below demonstrates the structure of a basic JoBase application.

```
from JoBase import *

window.caption = "JoBase Example"
man = Image(MAN)

def loop():
    man.draw()

run()
```

As you can see, the program above sets the window caption.
We then load an image and draw it in the game loop.
Please follow our [examples](https://jobase.org/examples) for an introduction to the features of JoBase.

#### Performance

![JoBase Performance Comparison](https://jobase.org/assets/images/graph.png)

Above is a JoBase speed comparison with other popular Python libraries.
The the graph compares the performance of the libraries **without batch rendering**.
Hundreds of images were drawn on the screen in random places and rotated in the game loop.

```
from JoBase import *
images = []

for i in range(100):
    man = Image(MAN, random(window.left, window.right), random(window.top, window.bottom))
    man.angle = random(1, 360)

    images.append(man)

def loop():
    for man in images:
        man.angle += 1
        man.draw()

run()
```
