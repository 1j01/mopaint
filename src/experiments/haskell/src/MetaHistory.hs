{-# LANGUAGE DataKinds #-}
{-# LANGUAGE FlexibleContexts #-}
{-# LANGUAGE OverloadedRecordDot #-}
{-# LANGUAGE ScopedTypeVariables #-}

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
    name :: String,
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
  | -- TODO: separate into HOperationData for non-meta operations?
    Circle
      { color :: String
      }
  | Triangle
      { color :: String
      }
  | Line
      { color :: String
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
      let removalMaybe = find (\removal -> removal.removedOp.id == targetID) removals
      case removalMaybe of
        Just removal ->
          if removal.removedByOp /= Nothing
            then error ("target operation '" ++ targetID ++ "' was already removed by operation '" ++ (fromJust removal.removedByOp).id ++ "'.")
            else error ("target operation '" ++ targetID ++ "' was already applied and thus can't be affected.")
        Nothing -> error ("target operation '" ++ targetID ++ "' not found.")
    Just targetOp -> do
      if targetOp.metaLevel == metaOpMetaLevel
        then error ("target operation '" ++ targetID ++ "' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves.")
        else
          if targetOp.metaLevel > metaOpMetaLevel
            -- This may never happen, since operations will be removed upon application,
            -- so it will get the "already applied and thus can't be affected" error instead.
            then error ("target operation '" ++ targetID ++ "' has greater meta level than the meta operation. Meta operations must only target operations less meta than themselves.")
            else targetOp

without :: (Eq a) => [a] -> a -> [a]
without list elem = filter (/= elem) list -- name only makes sense infix, not when partially applied

resolveMetaHistory :: [MHOperation] -> [MHOperation]
resolveMetaHistory metaHistory = resolveMetaHistory' (metaHistory, [])

resolveMetaHistory' :: ([MHOperation], [Removal]) -> [MHOperation]
resolveMetaHistory' (metaHistory, removals) = do
  let maxMetaLevel = maximum (0 : [op.metaLevel | op <- metaHistory])
  if maxMetaLevel == 0
    then metaHistory
    else do
      let opsOfMaxMetaLevel = filter (\op -> op.metaLevel == maxMetaLevel) metaHistory
      let nextOpMaybe = listToMaybe opsOfMaxMetaLevel
      case nextOpMaybe of
        Nothing -> metaHistory -- should this be an error?
        Just nextOp -> do
          let (metaHistory', removals') = applyMetaOperation nextOp.opData nextOp.metaLevel (metaHistory, removals)
          resolveMetaHistory' (metaHistory' `without` nextOp, removals' ++ [Removal {removedOp = nextOp, removedByOp = Nothing}])

applyMetaOperation :: MHOperationData -> Int -> ([MHOperation], [Removal]) -> ([MHOperation], [Removal])
applyMetaOperation Undo {target = targetID} metaLevel (metaHistory, removals) = do
  let targetOp = findTargetOp metaHistory targetID metaLevel removals
  -- TODO: add a removal record (we need the operation ID for the removal record btw; currently these functions are passed only MHOperationData, not the full MHOperation)
  -- BTW, why does no test fail for this? seems like a gap in coverage.
  (metaHistory `without` targetOp, removals)
applyMetaOperation Recolor {target = targetID, color = newColor} metaLevel (metaHistory, removals) = do
  let targetOp = findTargetOp metaHistory targetID metaLevel removals
  ([if op == targetOp then op {opData = op.opData {color = newColor}} else op | op <- metaHistory], removals)
applyMetaOperation Insert {insertIndex = insertIndex, insertOp = insertOp} metaLevel (metaHistory, removals) = do
  (take insertIndex metaHistory ++ (insertOp : drop insertIndex metaHistory), removals)

-- Simple versions:
-- applyMetaOperation :: MHOperationData -> [MHOperation] -> [MHOperation]
-- applyMetaOperation Undo {target = targetID} metaHistory =
--   filter (\op -> op.id /= targetID) metaHistory
-- applyMetaOperation Recolor {target = targetID, color = newColor} metaHistory = do
--   [if op.id == targetID then op {opData = op.opData {color = newColor}} else op | op <- metaHistory]
-- applyMetaOperation Insert {insertIndex = insertIndex, insertOp = insertOp} metaHistory = do
--   take insertIndex metaHistory ++ (insertOp : drop insertIndex metaHistory)
