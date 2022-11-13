------------------------------ MODULE Mopaint ------------------------------

EXTENDS Integers, Sequences, TLC

(* --algorithm resolveMetaHistory
variables
    maxMHI = 0;
    mhi = 0;
    i = 1;
    j = 1;
    op = <<>>;
    aMHI = <<0, 1, 2, 3, 0, 0, 1>>;
    aID = <<"abc1", "abc2", "abc3", "abc4", "abc5", "abc6", "abc7">>;
    aType = <<"line", "recolor", "undo", "undo", "circle", "triangle", "undo">>;
    aName = <<"Draw Line", "Edit Draw Line", "Undo Edit Draw Line", "Undo Undo Edit Draw Line", "Draw Circle", "Draw Triangle", "Undo Draw Triangle">>;
    aParams = << <<"blue">>, <<"abc1", "green">>, <<"abc2">>, <<"abc3">>, <<"pink">>, <<"red">>, <<"abc6">> >>;

define
    OK == pc = "Done" =>
        /\ (aMHI = <<0, 0>>)
        /\ (aID = <<"abc1", "abc5">>)
        /\ (aType = <<"line", "circle">>)
        /\ (aName = <<"Draw Line", "Draw Circle">>)
        /\ (aParams = <<"green", "pink">>)
end define;

macro removeOp(i) begin
    aMHI := SubSeq(aMHI, 0, i) \o SubSeq(aMHI, i + 1, Len(aMHI));
    aID := SubSeq(aID, 0, i) \o SubSeq(aID, i + 1, Len(aID));
    aType := SubSeq(aType, 0, i) \o SubSeq(aType, i + 1, Len(aType));
    aName := SubSeq(aName, 0, i) \o SubSeq(aName, i + 1, Len(aName));
    aParams := SubSeq(aParams, 0, i) \o SubSeq(aParams, i + 1, Len(aParams));
end macro;

begin
    FindBiggestMHI:
        while i <= Len(aID) do
            if aMHI[i] > maxMHI then
                maxMHI := aMHI[i];
            end if;
            Inc: \* why the label?
                i := i + 1
        end while;
    
    \* Can't use the name Init, because of PlusCal's leaky abstraction.
    InitLoop:
        mhi := maxMHI;

    ResolveMetaHistory:
        \* Note: purposely skipping mhi of 0, at that point it should be resolved.
        \* (Just mentioning it because most loops of this type you'd want >= 0)
        while mhi > 0 do
            i := 1;
            ResolveMetaHistoryLevel:
            while i <= Len(aID) do
                if aMHI[i] = mhi then
                    \* TODO: make sure it matches a target, and the meta-history index of the target is less, etc.
                    if aType[i] = "undo" then
                        j := 1;
                        FindTargetAndHandleUndoOp:
                        while j <= Len(aID) do
                            if aID[j] = aParams[i][1] then
                                \* print("undoing", otherOp);
                                removeOp(j);
                                \* break; optimization
                            end if;
                        end while;
                    elsif aType[i] = "recolor" then
                        j := 1;
                        FindTargetAndHandleRecolorOp:
                        while j <= Len(aID) do
                            if aID[j] = aParams[i][1] then
                                \* print("recoloring", otherOp);
                                \* color is first parameter of "line", second parameter of "recolor"
                                aParams[j][1] := aParams[i][2];
                                \* break; optimization
                            end if;
                        end while;
                    end if;
                    RemoveTheOp:
                        removeOp(i);
                end if;
                AnotherInc: \* is this really necessary?
                    i := i + 1
            end while;
            SomebodySpilledTheInc: \* please tell me the example didn't just do this to show that you CAN include labels in the body
                mhi := mhi - 1
        end while;
end algorithm; *)
\* BEGIN TRANSLATION (chksum(pcal) = "d6f9c6fb" /\ chksum(tla) = "baef1ab3")
VARIABLES maxMHI, mhi, i, j, op, aMHI, aID, aType, aName, aParams, pc

(* define statement *)
OK == pc = "Done" =>
    /\ (aMHI = <<0, 0>>)
    /\ (aID = <<"abc1", "abc5">>)
    /\ (aType = <<"line", "circle">>)
    /\ (aName = <<"Draw Line", "Draw Circle">>)
    /\ (aParams = <<"green", "pink">>)


vars == << maxMHI, mhi, i, j, op, aMHI, aID, aType, aName, aParams, pc >>

Init == (* Global variables *)
        /\ maxMHI = 0
        /\ mhi = 0
        /\ i = 1
        /\ j = 1
        /\ op = <<>>
        /\ aMHI = <<0, 1, 2, 3, 0, 0, 1>>
        /\ aID = <<"abc1", "abc2", "abc3", "abc4", "abc5", "abc6", "abc7">>
        /\ aType = <<"line", "recolor", "undo", "undo", "circle", "triangle", "undo">>
        /\ aName = <<"Draw Line", "Edit Draw Line", "Undo Edit Draw Line", "Undo Undo Edit Draw Line", "Draw Circle", "Draw Triangle", "Undo Draw Triangle">>
        /\ aParams = << <<"blue">>, <<"abc1", "green">>, <<"abc2">>, <<"abc3">>, <<"pink">>, <<"red">>, <<"abc6">> >>
        /\ pc = "FindBiggestMHI"

FindBiggestMHI == /\ pc = "FindBiggestMHI"
                  /\ IF i <= Len(aID)
                        THEN /\ IF aMHI[i] > maxMHI
                                   THEN /\ maxMHI' = aMHI[i]
                                   ELSE /\ TRUE
                                        /\ UNCHANGED maxMHI
                             /\ pc' = "Inc"
                        ELSE /\ pc' = "InitLoop"
                             /\ UNCHANGED maxMHI
                  /\ UNCHANGED << mhi, i, j, op, aMHI, aID, aType, aName, 
                                  aParams >>

Inc == /\ pc = "Inc"
       /\ i' = i + 1
       /\ pc' = "FindBiggestMHI"
       /\ UNCHANGED << maxMHI, mhi, j, op, aMHI, aID, aType, aName, aParams >>

InitLoop == /\ pc = "InitLoop"
            /\ mhi' = maxMHI
            /\ pc' = "ResolveMetaHistory"
            /\ UNCHANGED << maxMHI, i, j, op, aMHI, aID, aType, aName, aParams >>

ResolveMetaHistory == /\ pc = "ResolveMetaHistory"
                      /\ IF mhi > 0
                            THEN /\ i' = 1
                                 /\ pc' = "ResolveMetaHistoryLevel"
                            ELSE /\ pc' = "Done"
                                 /\ i' = i
                      /\ UNCHANGED << maxMHI, mhi, j, op, aMHI, aID, aType, 
                                      aName, aParams >>

ResolveMetaHistoryLevel == /\ pc = "ResolveMetaHistoryLevel"
                           /\ IF i <= Len(aID)
                                 THEN /\ IF aMHI[i] = mhi
                                            THEN /\ IF aType[i] = "undo"
                                                       THEN /\ j' = 1
                                                            /\ pc' = "FindTargetAndHandleUndoOp"
                                                       ELSE /\ IF aType[i] = "recolor"
                                                                  THEN /\ j' = 1
                                                                       /\ pc' = "FindTargetAndHandleRecolorOp"
                                                                  ELSE /\ pc' = "RemoveTheOp"
                                                                       /\ j' = j
                                            ELSE /\ pc' = "AnotherInc"
                                                 /\ j' = j
                                 ELSE /\ pc' = "SomebodySpilledTheInc"
                                      /\ j' = j
                           /\ UNCHANGED << maxMHI, mhi, i, op, aMHI, aID, 
                                           aType, aName, aParams >>

AnotherInc == /\ pc = "AnotherInc"
              /\ i' = i + 1
              /\ pc' = "ResolveMetaHistoryLevel"
              /\ UNCHANGED << maxMHI, mhi, j, op, aMHI, aID, aType, aName, 
                              aParams >>

RemoveTheOp == /\ pc = "RemoveTheOp"
               /\ aMHI' = SubSeq(aMHI, 0, i) \o SubSeq(aMHI, i + 1, Len(aMHI))
               /\ aID' = SubSeq(aID, 0, i) \o SubSeq(aID, i + 1, Len(aID))
               /\ aType' = SubSeq(aType, 0, i) \o SubSeq(aType, i + 1, Len(aType))
               /\ aName' = SubSeq(aName, 0, i) \o SubSeq(aName, i + 1, Len(aName))
               /\ aParams' = SubSeq(aParams, 0, i) \o SubSeq(aParams, i + 1, Len(aParams))
               /\ pc' = "AnotherInc"
               /\ UNCHANGED << maxMHI, mhi, i, j, op >>

FindTargetAndHandleUndoOp == /\ pc = "FindTargetAndHandleUndoOp"
                             /\ IF j <= Len(aID)
                                   THEN /\ IF aID[j] = aParams[i][1]
                                              THEN /\ aMHI' = SubSeq(aMHI, 0, j) \o SubSeq(aMHI, j + 1, Len(aMHI))
                                                   /\ aID' = SubSeq(aID, 0, j) \o SubSeq(aID, j + 1, Len(aID))
                                                   /\ aType' = SubSeq(aType, 0, j) \o SubSeq(aType, j + 1, Len(aType))
                                                   /\ aName' = SubSeq(aName, 0, j) \o SubSeq(aName, j + 1, Len(aName))
                                                   /\ aParams' = SubSeq(aParams, 0, j) \o SubSeq(aParams, j + 1, Len(aParams))
                                              ELSE /\ TRUE
                                                   /\ UNCHANGED << aMHI, aID, 
                                                                   aType, 
                                                                   aName, 
                                                                   aParams >>
                                        /\ pc' = "FindTargetAndHandleUndoOp"
                                   ELSE /\ pc' = "RemoveTheOp"
                                        /\ UNCHANGED << aMHI, aID, aType, 
                                                        aName, aParams >>
                             /\ UNCHANGED << maxMHI, mhi, i, j, op >>

FindTargetAndHandleRecolorOp == /\ pc = "FindTargetAndHandleRecolorOp"
                                /\ IF j <= Len(aID)
                                      THEN /\ IF aID[j] = aParams[i][1]
                                                 THEN /\ aParams' = [aParams EXCEPT ![j][1] = aParams[i][2]]
                                                 ELSE /\ TRUE
                                                      /\ UNCHANGED aParams
                                           /\ pc' = "FindTargetAndHandleRecolorOp"
                                      ELSE /\ pc' = "RemoveTheOp"
                                           /\ UNCHANGED aParams
                                /\ UNCHANGED << maxMHI, mhi, i, j, op, aMHI, 
                                                aID, aType, aName >>

SomebodySpilledTheInc == /\ pc = "SomebodySpilledTheInc"
                         /\ mhi' = mhi - 1
                         /\ pc' = "ResolveMetaHistory"
                         /\ UNCHANGED << maxMHI, i, j, op, aMHI, aID, aType, 
                                         aName, aParams >>

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\ UNCHANGED vars

Next == FindBiggestMHI \/ Inc \/ InitLoop \/ ResolveMetaHistory
           \/ ResolveMetaHistoryLevel \/ AnotherInc \/ RemoveTheOp
           \/ FindTargetAndHandleUndoOp \/ FindTargetAndHandleRecolorOp
           \/ SomebodySpilledTheInc
           \/ Terminating

Spec == Init /\ [][Next]_vars

Termination == <>(pc = "Done")

\* END TRANSLATION 
====

=============================================================================
\* Modification History
\* Last modified Sat Nov 12 19:34:28 EST 2022 by io
\* Created Tue Nov 01 23:51:25 EDT 2022 by io
