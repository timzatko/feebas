#! /bin/sh

if [ "$3" ]
then
  sh "$2 --config=$1 --debug"
else
  sh "$2 --config=$1"
fi

