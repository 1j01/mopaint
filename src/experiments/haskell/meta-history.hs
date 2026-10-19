{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedRecordDot #-}

module MetaHistory
  ( resolveMetaHistory,
    MHOperation (..),
    MHOperationData (..),
  )
where

import Data.List (find)
import Data.Maybe (fromJust, listToMaybe)

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
  let targetOpMaybe = find isTargetOp metaHistory
  case targetOpMaybe of
    Nothing -> do
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
    Just targetOp -> do
      if targetOp.metaLevel == metaOpMetaLevel
        then error ("target operation '" ++ targetID ++ "' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves.")
        else
          if targetOp.metaLevel > metaOpMetaLevel
            -- This may never happen, since operations will be removed upon application,
            -- so it will get the "already applied and thus can't be affected" error instead.
            then error ("target operation '" ++ targetID ++ "' has greater meta level than the meta operation. Meta operations must only target operations less meta than themselves.")
            else
              targetOp

resolveMetaHistory (metaHistory :: [MHOperation]) = do
  let maxMetaLevel = maximum (0 : [op.metaLevel | op <- metaHistory])
  let opsOfMaxMetaLevel = [op | op <- metaHistory, op.metaLevel == maxMetaLevel]
  let nextOp = listToMaybe opsOfMaxMetaLevel
  if nextOp == Nothing || maxMetaLevel == 0
    then
      metaHistory
    else do
      -- TODO: remove nextOp from history and track removals for better error reporting
      let metaHistory' = applyMetaOperation (fromJust nextOp).opData metaHistory
      resolveMetaHistory (metaHistory')

applyMetaOperation :: MHOperationData -> [MHOperation] -> [MHOperation]
applyMetaOperation Undo {target = target} metaHistory = do
  error "todo"
-- 					const targetOp = findTargetOp(mutableMH, op.target!, op.metaLevel, removals);
-- 					mutableMH.splice(mutableMH.indexOf(targetOp), 1);
-- 					removals.push({ removedOp: targetOp, removedByOp: op });

applyMetaOperation Recolor {target = target, color = color} metaHistory = do
  error "todo"
-- 					const targetOp = findTargetOp(mutableMH, op.target!, op.metaLevel, removals);
-- 					if (!("color" in targetOp)) {
-- 						throw new Error(`target operation '${targetOp.id}' does not have a color property.`);
-- 					}
-- 					targetOp.color = op.color;

applyMetaOperation Insert {insertIndex = insertIndex, insertOp = insertOp} metaHistory = do
  error "todo"

-- 					mutableMH.splice(op.insertIndex!, 0, op.insertOp!);
