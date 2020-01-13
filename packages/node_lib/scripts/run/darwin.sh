#! /bin/sh

if [ "$3" = "1" ]
then
  open $2 --args --config=$1 --project="$4" --debug
else
  open $2 --args --config=$1 --project="$4"
fi
