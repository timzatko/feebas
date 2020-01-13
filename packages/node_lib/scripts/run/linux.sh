#! /bin/sh

if [ "$3" = "1" ]
then
  sh "$2 --config=$1 --project=$4 --debug"
else
  sh "$2 --config=$1 --project=$4"
fi

