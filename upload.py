#!/usr/bin/env python3

from getpass import getpass
from ftplib import FTP
from os import walk
from sys import argv, stdout
from fnmatch import fnmatch
from platform import system
from datetime import datetime
from os.path import getmtime, samefile, exists, relpath, basename

##################
#                #
#    FTP INFO    #
#                #
##################
host = "files.000webhost.com"
user = "trosh"
password = getpass(host + " password : ")

# Print emphasized text
def emph(text):
    print()
    if system() == "Windows":
        print(text)
        print("=" * len(text))
    else:
        print("\033[1;7m{}\033[m".format(text))

# Get path to script AND get pathless script name
if __file__[:2] == "./":
    __file__ = __file__[2:]
prefix = ""
for i in range(len(__file__), 0, -1):
    if __file__[i-1] == "/":
        prefix = __file__[:i-1]
        __file__ = __file__[i:]
        break

# Prefix string OR list of strings with path to script
def p(f):
    if prefix == "":
        return f
    if type(f) is list:
        return [prefix + "/" + s for s in f]
    if type(f) is str:
        return prefix + "/" + f
    raise TypeError(type(f))

#########################
#                       #
#    FILES TO IGNORE    #
#    (with glob)        #
#                       #
#########################
gitignore = ".gitignore"
ignores = p([
    gitignore,
    __file__
])
# Extract gitignore content
with open(p(gitignore), "r") as gitignoref:
    for line in gitignoref:
        ignores.append(p(line.rstrip()))
emph("ignored files")
print(*ignores, sep="\n")

#########################
#                       #
#    PATHS TO IGNORE    #
#    (with glob)        #
#                       #
#########################
ignorepaths = p([
    ".git"
])
emph("ignored paths")
print(*ignorepaths, sep="\n")

######################
#                    #
#    BINARY FILES    #
#    (no glob!)      #
#                    #
######################
binaries = p([
    "favicon.ico"
])
emph("binary files")
print(*binaries, sep="\n")

def tobekept(filename):
    for ignore in ignores:
        if fnmatch(filename, ignore):
            return False
    return True

def tobetraversed(pathname):
    for ignorepath in ignorepaths:
        if fnmatch(pathname, ignorepath) or \
           fnmatch(pathname, ignorepath + "/*") or \
           fnmatch(pathname, "*/" + ignorepath) or \
           fnmatch(pathname, "*/" + ignorepath + "/*"):
            return False
    return True

#########################
#                       #
#    FILES TO UPLOAD    #
#                       #
#########################

files = []
if len(argv) > 1:
    for filename in argv[1:]:
        if tobetraversed(relpath(basename(filename), prefix)) and \
           tobekept(basename(filename)) and \
           exists(filename):
            files.append(filename)
        else:
            print("ignored " + filename)
else:
    for (dirpath, dirnames, filenames) in walk(p(".")):
        if tobetraversed(dirpath):
            for filename in filenames:
                if tobekept(filename):
                    files.append(dirpath + "/" + filename)
emph("files to upload")
print(*files, sep="\n")

print()
print("connecting... ", end="")
stdout.flush()
with FTP(host, user, password) as ftp:
    print("done.")

    print("entering public_html... ", end="")
    ftp.cwd("public_html")
    print("done.")

    # Display remote files (recursively)
    # AND
    # Build dictionary of mtimes
    remotemtimes = {}
    global subdirs
    global currpath
    def dirCallback(line):
        f = line.split(" ")[-1]
        if f in [".", ".."]:
            return
        if line[0] == "d":
            global subdirs
            global currpath
            subdir = currpath + "/" + f
            subdirs.append(subdir)
        else:
            filename = (currpath + "/" + f)[2:]
            print(filename)
            remotemtime = " ".join(line.split(" ")[-4:-1])
            if ":" in remotemtime:
                remotemtime = \
                    datetime.strptime(
                            remotemtime, "%b %d %H:%M"
                        ).replace(datetime.now().year)
            else:
                remotemtime = datetime.strptime(
                        remotemtime, "%b %d %Y")
            remotemtimes[filename] = remotemtime
    def tree(path):
        global subdirs
        global currpath
        subdirs = []
        currpath = path
        ftp.dir(path, dirCallback)
        localsubdirs = subdirs
        for subdir in localsubdirs:
            tree(subdir)
    emph("current files in public_html:")
    tree(".")

    emph("Uploading files")
    for file in files:
        # Break if remote file newer
        for remotefile in remotemtimes:
            if exists(p(remotefile)) and \
               samefile(p(remotefile), file):
                localmtime = datetime.fromtimestamp(getmtime(file))
                if remotemtimes[remotefile] >= localmtime:
                    print(remotefile + " too old")
                    break
        else:
            # Determine stor function (bin/text)
            stor = None
            for binary in binaries:
                if samefile(file, binary):
                    stor = ftp.storbinary
                    break
            else:
                stor = ftp.storlines
            with open(file, "rb") as fp:
                stor("STOR " + file, fp)
            print(file)

    emph("current files in public_html:")
    tree(".")

