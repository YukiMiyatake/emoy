package main

import (
	"fmt"

	"github.com/looplab/fsm"
)

const (
	start  = "start"
	middle = "middle"
	end    = "end"
	finish = ""
)

func main() {

	eventTree := fsm.Events{
		{Name: start, Src: []string{start}, Dst: middle},
		{
			Name: middle,
			Src:  []string{start},
			Dst:  end,
		},
		{
			Name: end,
			Src:  []string{end, start},
			Dst:  finish,
		},
		{
			Name: finish,
			Src:  []string{finish, middle},
			Dst:  finish,
		},
	}

	ownFsm := fsm.NewFSM(
		start,
		eventTree,
		fsm.Callbacks{},
	)

	ownFsm.Current()    // start
	ownFsm.Event(start) // start eventが発火し、Dstのnodeへ遷移
	ownFsm.Current()    // middle

	//fsm.VisualizeWithType(ownFsm,fsm.GRAPHVIZ)
	// http://www.webgraphviz.com/
	fmt.Println("Hello")
}
