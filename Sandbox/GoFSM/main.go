package main

import (
	"bufio"
	"fmt"
	"os"

	"github.com/looplab/fsm"
)

const (
	start  = "start"
	middle = "middle"
	end    = "end"
	finish = ""
)

type MainState struct {
	To  string
	FSM *fsm.FSM
}

func NewMainState(to string) *MainState {
	s := &MainState{
		To: to,
	}

	s.FSM = fsm.NewFSM(
		"init",
		fsm.Events{
			{Name: "Next", Src: []string{"init"}, Dst: "logo"},
			{Name: "Next", Src: []string{"logo"}, Dst: "title"},
			{Name: "Timeout", Src: []string{"title"}, Dst: "demo"},
			{Name: "PushButton", Src: []string{"title"}, Dst: "title"},
			{Name: "Timeout", Src: []string{"demo"}, Dst: "title"},
			{Name: "PushButton", Src: []string{"demo"}, Dst: "title"},
			{Name: "Start", Src: []string{"title"}, Dst: "gameStart"},
			{Name: "Next", Src: []string{"gameStart"}, Dst: "gaming"},
			{Name: "End", Src: []string{"gaming"}, Dst: "gameEnd"},
		},
		fsm.Callbacks{
			"enter_state": func(e *fsm.Event) { s.enterState(e) },
			//"before_event": func(e *fsm.Event) { e.Cancel() },  // Guard
			"before_Timeout": func(e *fsm.Event) { e.Cancel() }, // Guard
		},
	)

	return s
}

func (s *MainState) enterState(e *fsm.Event) {
	fmt.Printf("%s to %s\n", e.Src, e.Dst)
}

func main() {

	mainState := NewMainState("init")

	scanner := bufio.NewScanner(os.Stdin)
	for {
		scanner.Scan()
		in := scanner.Text()

		err := mainState.FSM.Event(in)
		if err != nil {
			fmt.Println(err)
		}
	}

	//fsm.VisualizeWithType(ownFsm,fsm.GRAPHVIZ)
	// http://www.webgraphviz.com/
}
