#!/usr/bin/env python3

from getpass import getpass
from ftplib import FTP
from os import walk
from sys import exit
from glob import glob

def emph(text):
    print()
    print(text)
    print("=" * len(text))

host = "files.000webhost.com"
user = "trosh"
password = getpass(host + " password : ")

gitignore = ".gitignore"
ignores = [gitignore]
if __file__[:2] == "./": ignores.append(__file__[2:])
else: ignores.append(__file__)
with open(gitignore, "r") as gitignoref:
    for line in gitignoref:
        ignores.extend(glob(line.rstrip())) # TODO make sure glob works from another path
emph("ignoring following files")
print(*ignores, sep=" ")
ignorepaths = [".git"]

binaries = [
    "favicon.ico"
]

emph("binary files to upload")
print(*binaries, sep=" ")

asciis = []
# TODO walk in argv[0]'s real path
for (dirpath, dirnames, filenames) in walk("."):
    if any([ignorepath in dirpath for ignorepath in ignorepaths]):
        continue
    for filename in filenames:
        if filename in ignores or \
           filename in binaries:
            continue
        asciis.append((dirpath + "/" + filename)[2:])

emph("text files to upload")
print(*asciis, sep=" ")

print("connecting... ", end="")
with FTP(host, user, password) as ftp:
    print("done.")

    print("entering public_html... ", end="")
    ftp.cwd("public_html")
    print("done.")
    # recursive dir()
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
            print((currpath + "/" + f)[2:])
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

    emph("Uploading binary files")
    for binary in binaries:
        print(binary)
        with open(binary, "rb") as fp:
            ftp.storbinary("STOR " + binary, fp)

    emph("Uploading text files")
    for ascii in asciis:
        print(ascii)
        with open(ascii, "rb") as fp:
            ftp.storlines("STOR " + ascii, fp)

    emph("current files in public_html:")
    tree(".")

