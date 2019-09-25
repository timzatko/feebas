#! /bin/sh

if [ "$3" ]
then
  open $2 --args --config=$1 --debug
else
  open $2 --args --config=$1
fi
