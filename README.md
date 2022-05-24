### Welcome to JoBase
JoBase is a really fast Python game library for beginner coders.
It is written in pure C and uses the same modern tools as high-end games like Minecraft.

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
