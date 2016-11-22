#!/usr/bin/env python3

from getpass import getpass
from ftplib import FTP
from os import walk
from sys import exit
from glob import glob

host = "files.000webhost.com"
user = "trosh"
password = getpass(host + " password : ")

gitignore = ".gitignore"
ignores = [gitignore, __file__[2:]] # TODO make sure __file__ works from another path
with open(gitignore, "r") as gitignoref:
    for line in gitignoref:
        ignores.extend(glob(line.rstrip())) # TODO make sure glob works from another path
print("\033[7mignoring following files\033[m")
print(" ".join(ignores))
ignorepaths = [".git"]

binaries = [
    "favicon.ico"
]

print("\033[7mbinary files to upload\033[m")
print(" ".join(binaries))

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

print("\033[7mtext files to upload\033[m")
print(" ".join(asciis))

print("\033[7mconnecting... \033[m", end="")
with FTP(host, user, password) as ftp:
    print("\033[7mdone.\033[m")

    print("\033[7mentering public_html... \033[m", end="")
    ftp.cwd("public_html")
    print("\033[7mdone.\033[m")
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
    tree(".")

    print("\033[7mUploading binary files\033[m")
    for binary in binaries:
        print(binary)
        with open(binary, "rb") as fp:
            ftp.storbinary("STOR " + binary, fp)

    print("\033[7mUploading text files\033[m")
    for ascii in asciis:
        print(ascii)
        with open(ascii, "rb") as fp:
            ftp.storlines("STOR " + ascii, fp)

    tree(".")

