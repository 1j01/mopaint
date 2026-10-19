{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedRecordDot #-}

module Main where

import Data.Maybe (fromJust, listToMaybe)

main :: IO ()
main = putStrLn "Hello, World!"

-- data MHOpType = Undo | Recolor | Insert
--   deriving (Show, Eq)

-- data MHOperation = MHOperation
--   { id :: String,
--     metaLevel :: Int,
--     -- application-specific data
--     opType :: MHOpType,
--     target :: Maybe String,
--     color :: Maybe String,
--     insertIndex :: Maybe Int,
--     insertOp :: Maybe MHOperation
--   }
--   deriving (Show, Eq)

data MHOperation = MHOperation
  { id :: String,
    metaLevel :: Int,
    opData :: MHOperationData
  }
  deriving (Show, Eq)

data MHOperationData
  = Undo
      {target :: String}
  | Recolor
      { target :: String,
        color :: String
      }
  | Insert
      { insertIndex :: Int,
        insertOp :: MHOperation
      }
  deriving (Show, Eq)

data Removal = Removal
  { removedOp :: MHOperation,
    removedByOp :: Maybe MHOperation
  }

findTargetOp :: [MHOperation] -> String -> Int -> [Removal] -> MHOperation
findTargetOp (metaHistory :: [MHOperation]) (targetID :: String) (metaOpMetaLevel :: Int) (removals :: [Removal]) = do
  --  Makes sure it matches a target, and the target is less meta than the meta operation.
  let isTargetOp op = op.id == targetID
  let targetOp = listToMaybe (filter isTargetOp metaHistory)
  if targetOp == Nothing
    then
      -- TODO: check removals
      -- for (const { removedOp, removedByOp } of removals) {
      -- 	if (removedOp.id === targetID) {
      -- 		if (removedByOp) {
      -- 			throw new Error(`target operation '${targetID}' was already removed by operation '${removedByOp.id}'.`);
      -- 		} else {
      -- 			throw new Error(`target operation '${targetID}' was already applied and thus can't be affected.`);
      -- 		}
      -- 	}
      -- }
      error ("target operation '" ++ targetID ++ "' not found.")
    else
      if (fromJust targetOp).metaLevel == metaOpMetaLevel
        then error ("target operation '" ++ targetID ++ "' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves.")
        else
          if (fromJust targetOp).metaLevel > metaOpMetaLevel
            -- This may never happen, since operations will be removed upon application,
            -- so it will get the "already applied and thus can't be affected" error instead.
            then error ("target operation '" ++ targetID ++ "' has greater meta level than the meta operation. Meta operations must only target operations less meta than themselves.")
            else
              fromJust targetOp

resolveMetaHistory (metaHistory :: [MHOperation]) = do
  let maxMetaLevel = maximum (0 : [op.metaLevel | op <- metaHistory])
  let opsOfMaxMetaLevel = [op | op <- metaHistory, op.metaLevel == maxMetaLevel]
  let nextOp = listToMaybe opsOfMaxMetaLevel
  if nextOp == Nothing
    then
      metaHistory
    else do
      -- TODO: remove nextOp from history and track removals for better error reporting
      let metaHistory' = applyMetaOperation (fromJust nextOp).opData metaHistory
      resolveMetaHistory (metaHistory')

applyMetaOperation :: MHOperationData -> [MHOperation] -> [MHOperation]
applyMetaOperation Undo {target = target} metaHistory = error "todo"
applyMetaOperation Recolor {target = target, color = color} metaHistory = error "todo"
applyMetaOperation Insert {insertIndex = insertIndex, insertOp = insertOp} metaHistory = error "todo"

-- export function resolveMetaHistory(metaHistory: readonly MHOperation[]) {

-- 	const maxMetaLevel = metaHistory.reduce((maxMetaLevel, op) => Math.max(maxMetaLevel, op.metaLevel), 0);
-- 	const mutableMH = JSON.parse(JSON.stringify(metaHistory)) as MHOperation[];
-- 	const removals = [];

-- 	// Note: stopping loop before metaLevel of 0, as at that point it should be resolved.
-- 	// (With most loops counting down you'd want >= 0.)
-- 	for (let metaLevel = maxMetaLevel; metaLevel > 0; metaLevel--) {
-- 		// The for-of loop could miss operations due to mutation without a copy.
-- 		// We don't need a deep clone to handle splicing, just a new array.
-- 		const frozenMH = Object.freeze([...mutableMH]);
-- 		for (const op of frozenMH) {
-- 			if (op.metaLevel === metaLevel) {
-- 				if (op.type === "undo") {
-- 					const targetOp = findTargetOp(mutableMH, op.target!, op.metaLevel, removals);
-- 					mutableMH.splice(mutableMH.indexOf(targetOp), 1);
-- 					removals.push({ removedOp: targetOp, removedByOp: op });
-- 				} else if (op.type === "recolor") {
-- 					const targetOp = findTargetOp(mutableMH, op.target!, op.metaLevel, removals);
-- 					if (!("color" in targetOp)) {
-- 						throw new Error(`target operation '${targetOp.id}' does not have a color property.`);
-- 					}
-- 					targetOp.color = op.color;
-- 				} else if (op.type === "insert") {
-- 					mutableMH.splice(op.insertIndex!, 0, op.insertOp!);
-- 				} else {
-- 					throw new Error(`unknown meta operation type '${(op as MHOperation).type}'.`);
-- 				}
-- 				mutableMH.splice(mutableMH.indexOf(op), 1);
-- 				removals.push({ removedOp: op, removedByOp: null });
-- 			}
-- 		}
-- 	}
-- 	// Sanity check: make sure all meta operations were applied.
-- 	for (const op of mutableMH) {
-- 		if (op.metaLevel > 0) {
-- 			throw new Error(`meta operation '${op.id}' was left behind, never applied while resolving meta-history.`);
-- 		}
-- 	}
-- 	return mutableMH;
-- }
